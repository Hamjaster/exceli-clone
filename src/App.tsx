import { useLayoutEffect, useState } from "react";
import "./App.css";
import rough from "roughjs";
import type { Drawable } from "roughjs/bin/core";
import { adjustCordinates, findElementAtPosition, generateId } from "./utiles";
const generator = rough.generator();

export type Element = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: string;
  roughElement: Drawable;
  offsetX?: number; // used for selection to displace the element from the point where it was clicked
  offsetY?: number; // used for selection to displace the element from the point where
};

function App() {
  const [action, setAction] = useState("none"); // drawing, selecting
  const [tool, setTooltype] = useState("line"); // rectangle, line, selection
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [elements, setElements] = useState<Element[]>([]);

  const createElement = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    elementType: string,
    id?: string
  ): Element => {
    let roughElement: Drawable;
    if (elementType === "rectangle") {
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    } else if (elementType === "line") {
      roughElement = generator.line(x1, y1, x2, y2);
    }
    return {
      id: !id ? generateId() : id,
      x1,
      y1,
      x2,
      y2,
      roughElement,
      type: elementType,
    };
  };

  const updateElement = (
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    elementType: string
  ) => {
    const updatedElement = createElement(x1, y1, x2, y2, elementType, id);
    const updatedElements = [...elements];
    const index = updatedElements.findIndex((el) => el.id === id);
    updatedElements[index] = updatedElement;
    setElements(updatedElements);
  };

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    const roughtCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      roughtCanvas.draw(element.roughElement);
    });
  }, [elements]);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = e;
    if (tool === "selection") {
      // Handle selection logic here
      // check if clientX, and clientY are within the bounds of any existing element
      const selectedElement = findElementAtPosition(clientX, clientY, elements);
      if (selectedElement) {
        console.log("Element selected", selectedElement);
        // use of offset is necessary to displace the element from the point where it was clicked
        const offsetX = clientX - selectedElement.x1;
        const offsetY = clientY - selectedElement.y1;
        setSelectedElement({ ...selectedElement, offsetX, offsetY });
        setAction("selecting");
      }
    } else {
      setAction("drawing");
      const element = createElement(clientX, clientY, clientX, clientY, tool);
      setElements((prev) => [...prev, element]);
      console.log("Mouse Down", e.clientX, e.clientY);
    }
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (action === "drawing") {
      console.log("Mouse Up", e.clientX, e.clientY);
      const index = elements.length - 1;
      const lastElement = elements[index];
      const { x1, y1, x2, y2 } = lastElement;
      console.log(x1, y1, x2, y2);

      const { x1: X, x2: Y, y1: X2, y2: Y2 } = adjustCordinates(lastElement);
      console.log(X, X2, Y, Y2, "news");

      updateElement(lastElement.id, X, X2, Y, Y2, lastElement.type);
      console.log("updated!");
    }
    setAction("none");
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = e;
    if (tool === "selection") {
      const hoveredElement = findElementAtPosition(clientX, clientY, elements);
      e.currentTarget.style.cursor = hoveredElement ? "move" : "default";
    }
    if (tool === "resize") {
      console.log("am resizing");
      const position = findElementAtPosition(
        clientX,
        clientY,
        elements
      )?.position;
      let cursor;
      switch (position) {
        case "tl":
        case "start":
        case "br":
        case "end":
          cursor = "nwse-resize";
          break;
        case "tr":
        case "bl":
          cursor = "nesw-resize";
          break;

        default:
          cursor = "default";
          break;
      }
      e.currentTarget.style.cursor = cursor;
    }
    if (action === "drawing") {
      const index = elements.length - 1;
      const lastElement = elements[index];
      updateElement(
        lastElement.id,
        lastElement.x1,
        lastElement.y1,
        clientX,
        clientY,
        tool
      );
      console.log("Mouse Move", e.clientX, e.clientY);
    } else if (action === "selecting" && selectedElement) {
      console.log("dragging element");
      const { x1, y1, x2, y2 } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      console.log("ID :-", selectedElement.id);
      // off set needed to displace the element from the point where it was clicked
      const { offsetX = 0, offsetY = 0 } = selectedElement;
      const newX1 = clientX - offsetX;
      const newY1 = clientY - offsetY;
      updateElement(
        selectedElement.id,
        newX1,
        newY1,
        width + newX1,
        height + newY1,
        selectedElement.type
      );
    }
  };

  return (
    <>
      {/* a radio selector to swtich between the element types */}
      <div className="fixed flex justify-center items-center space-x-4 mb-4">
        <label>
          <input
            type="radio"
            value="line"
            checked={tool === "line"}
            onChange={(e) => setTooltype(e.target.value)}
          />
          Line
        </label>
        <label>
          <input
            type="radio"
            value="rectangle"
            checked={tool === "rectangle"}
            onChange={(e) => setTooltype(e.target.value)}
          />
          Rectangle
        </label>
        <label>
          <input
            type="radio"
            value="selection"
            checked={tool === "selection"}
            onChange={(e) => setTooltype(e.target.value)}
          />
          Selection
        </label>
        <label>
          <input
            type="radio"
            value="resize"
            checked={tool === "resize"}
            onChange={(e) => setTooltype(e.target.value)}
          />
          Resize
        </label>
      </div>
      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        className=" bg-white "
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      ></canvas>
    </>
  );
}

export default App;
