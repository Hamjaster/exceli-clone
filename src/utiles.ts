import type { Drawable } from "roughjs/bin/core";
import type { Element } from "./App";
import type { RoughCanvas } from "roughjs/bin/canvas";
import getStroke from "perfect-freehand";

const distance = (a: { x: number, y: number }, b: { x: number, y: number }) => {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function findElementAtPosition(x: number, y: number, elements: Element[]) {
    const existingElement = elements.find(element => positionWithinElement(x, y, element) !== "outside")
    if(existingElement){
        return {...existingElement, position: positionWithinElement(x, y, existingElement)}
    }
    
}

const onLine = (x1 : number, y1 : number, x2 : number, y2 : number, x: number, y: number, offset : number = 1): boolean => {
    const a = { x: x1, y: y1 };
        const b = { x: x2, y: y2 };
        const c = { x, y };

        const threshold = distance(a, b) - (distance(a, c) + distance(b, c)) 
        return Math.abs(threshold) < offset;

}


const positionWithinElement = (x: number, y: number, element: Element) : string  => {
    const { x1, y1, x2, y2, type } = element;
    if (type === "rectangle") {
        // check if point is at top-left, bottom-right, top-right, bottom-left or inside the rectangle
        const isTopLeft = isPointNear(x, y, x1, y1);
        const isTopRight = isPointNear(x, y, x2, y1);
        const isBottomRight = isPointNear(x, y, x2, y2);
        const isBottomLeft = isPointNear(x, y, x1, y2);
        if(isTopLeft){
            return "tl"
        }else if(isTopRight) {
            return "tr"
        } else if(isBottomRight) {
            return "br"
        }
        else if(isBottomLeft) {
            return "bl"
        }
        return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : "outside";

    } else if (type === "line") {
        // For a point to be within a line, the sum of two distance from the points to endpoints should be equal(approx, or thora sa greater) to distance btw endpoints
        // a, b are endpoints, c is the clicked point
        const on = onLine(x1, y1, x2, y2, x, y);
        const isOnStart = isPointNear(x, y, x1, y1);
        const isOnEnd = isPointNear(x, y, x2, y2);

        if(isOnStart) {
            return "start";
        }else if(isOnEnd) {
            return "end";
        }

        return on  ? 'inside' : 'outside'; // Adjust the threshold as needed
    }
    else if (type === "pencil") {
        if(!element.points || element.points.length === 0) return "outside"; 
        const btwAnyPoints = element.points.some((point, index) => {
            const nextPoint = element.points[index + 1]
            const on = onLine(point.x, point.y, nextPoint?.x , nextPoint?.y, x, y, 5);
            return on;
        })
        return btwAnyPoints ? "inside" : "outside"; // If the point is on any of the pencil stroke points, return inside
    }
    else if(type  === "text") {
        // text box basically forms a rectangle
        return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : "outside";
    }
    else {
        return "outside"; // default case, should not happen
    }

}

// random id generator
export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
}
interface AdjustedCoordinates {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
export const adjustCordinates = (element : Element) : AdjustedCoordinates => {
    const { x1, y1, x2, y2, type } = element;
    // Adjust cordinates such that x1, y1 are always top-left and x2, y2 are always bottom-right
    if (type === "rectangle") {
        console.log('old ones ', x1, y1, x2, y2);
        console.log('new ones ', {
            x1: Math.min(x1, x2),
            y1: Math.min(y1, y2),
            x2: Math.max(x1, x2),
            y2: Math.max(y1, y2)
        });
        return {
            x1: Math.min(x1, x2),
            y1: Math.min(y1, y2),
            x2: Math.max(x1, x2),
            y2: Math.max(y1, y2)
        };
    } else if (type === "line") {
        // lesser are always x1, greater are always x2 (except for vertical lines, when the upper is x1,y1, lower is x2,y2)
        const isVertical = x1 === x2;
        if( (x1 < x2 ) || (isVertical && y1 < y2) ) {
        return { x1, y1, x2, y2 };
        }else {
            return { x1: x2, y1: y2, x2: x1, y2: y1 };
        }
    }
    return { x1, y1, x2, y2 }; // default case, should not happen
}

export const isPointNear = (x : number, y : number, x1 : number, y1 : number): boolean => {

return Math.abs(x - x1) < 10 && Math.abs(y - y1) < 10;
}


export function resizedCordinates(cordinates : any, clientX : any, clientY : any, position: string): { X1: any; Y1: any; X2: any; Y2: any; } {
    const {x1, y1, x2, y2} = cordinates;
  switch (position) {
      case "start":
    case 'tl': 
        return {X1: clientX, Y1:clientY , X2: x2, Y2:y2 , };
        break;
    case 'tr':
        return {X1: x1, Y1:clientY , X2: clientX, Y2:y2 , };
        break;
    case 'bl':
        return {X1: clientX, Y1:y1 , X2: x2, Y2:clientY , };
        break;
        case "end":
    case 'br':
        return {X1: x1, Y1:y1 , X2: clientX, Y2:clientY , };
        break;
  
    default:
        return {X1: x1, Y1:y1 , X2: x2, Y2:y2 , };
        break;
  }
}

// Turn the points returned from perfect-freehand into SVG path data.

export function getSvgPathFromStroke(stroke : any) {
  if (!stroke.length) return ""

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ["M", ...stroke[0], "Q"]
  )

  d.push("Z")
  return d.join(" ")
}


export function drawingElement(element: Element, roughtCanvas: RoughCanvas, ctx: CanvasRenderingContext2D ) {
    switch (element.type) {
        case "rectangle":
            roughtCanvas.draw(element.roughElement);
            break;
        case "line":
            roughtCanvas.draw(element.roughElement);
            break;
        case "pencil":
            const inputPoints = element.points || [];
            const stroke = getStroke(inputPoints, {
            size: 8,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
            easing: (t) => t,
            last: true,
                simulatePressure: true,
            })
            const pathData = getSvgPathFromStroke(stroke)
            const myPath = new Path2D(pathData)
            ctx.fill(myPath)
            // Draw Pencil path
            break;

        case "text":
            ctx.font = "24px sans-serif";
            ctx.fillText(element.text || "", element.x1, element.y1);
            ctx.textBaseline = "top"; 
            // Draw text

        default:
            break;
    }
}


export function adjustmentRequired(tool: string) {
    // If the tool is pencil, we don't need to adjust the coordinates
    // If the tool is rectangle or line, we need to adjust the coordinates
    return tool === "rectangle" || tool === "line";
}


