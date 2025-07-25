import type { Element } from "./App";

const distance = (a: { x: number, y: number }, b: { x: number, y: number }) => {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}


export function findElementAtPosition(x: number, y: number, elements: Element[]) {
    const existingElement = elements.find(element => positionWithinElement(x, y, element) !== "outside")
    if(existingElement){
        return {...existingElement, position: positionWithinElement(x, y, existingElement)}
    }
    
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
        const a = { x: x1, y: y1 };
        const b = { x: x2, y: y2 };
        const c = { x, y };

        const threshold = distance(a, b) - (distance(a, c) + distance(b, c)) 

        const isOnStart = isPointNear(x, y, x1, y1);
        const isOnEnd = isPointNear(x, y, x2, y2);

        if(isOnStart) {
            return "start";
        }else if(isOnEnd) {
            return "end";
        }

        return Math.abs(threshold) < 1  ? 'inside' : 'outside'; // Adjust the threshold as needed
    }else {
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
