import { useLayoutEffect, useState } from "react";
import "./App.css";
import rough from "roughjs";
import type { Drawable } from "roughjs/bin/core";
import { findElementAtPosition } from "./utiles";
const generator = rough.generator();

export type Element = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roughElement: Drawable;
};

function App() {
  const [action, setAction] = useState("drawing"); // or 'selecting', etc.
  const [elementType, setElementType] = useState("line"); // or 'line', etc.
  const [elements, setElements] = useState<Element[]>([]);

  const createElement = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    elementType: string
  ): Element => {
    let roughElement: Drawable;
    if (elementType === "rectangle") {
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    } else if (elementType === "line") {
      roughElement = generator.line(x1, y1, x2, y2);
    }
    return { x1, y1, x2, y2, roughElement };
  };

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    const roughtCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      roughtCanvas.draw(element.roughElement);
    });
  });

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = e;
    if (elementType === "selection") {
      // Handle selection logic here
      // check if clientX, and clientY are within the bounds of any existing element
      const selectedElement = findElementAtPosition(clientX, clientY, elements);
    } else {
      setAction("drawing");
      const element = createElement(
        clientX,
        clientY,
        clientX,
        clientY,
        elementType
      );
      setElements((prev) => [...prev, element]);
      console.log("Mouse Down", e.clientX, e.clientY);
    }
  };
  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setAction("none");
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (action === "drawing") {
      const index = elements.length - 1;
      const lastElement = elements[index];
      const updatedElement = createElement(
        lastElement.x1,
        lastElement.y1,
        e.clientX,
        e.clientY,
        elementType
      );
      const updatedElements = [...elements];
      updatedElements[index] = updatedElement;
      console.log("Updated Elements", updatedElements);
      setElements(updatedElements);

      console.log("Mouse Move", e.clientX, e.clientY);
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
            checked={elementType === "line"}
            onChange={(e) => setElementType(e.target.value)}
          />
          Line
        </label>
        <label>
          <input
            type="radio"
            value="rectangle"
            checked={elementType === "rectangle"}
            onChange={(e) => setElementType(e.target.value)}
          />
          Rectangle
        </label>
        <label>
          <input
            type="radio"
            value="selection"
            checked={elementType === "selection"}
            onChange={(e) => setElementType(e.target.value)}
          />
          Selection
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
