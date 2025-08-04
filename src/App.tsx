import {
  act,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import "./App.css";
import rough from "roughjs";
import type { Drawable } from "roughjs/bin/core";
import {
  adjustCordinates,
  adjustmentRequired,
  distanceFormula,
  drawingElement,
  findElementAtPosition,
  generateId,
  resizedCordinates,
} from "./utiles";
import useHistory from "./useHistory";
import type { RoughCanvas } from "roughjs/bin/canvas";
import useKeys from "./useKeys";
import DisableZoom from "./DisableZoom";
import usePreventZoom from "./DisableZoom";
const generator = rough.generator();

export type Element = {
  id: string;
  // for shapes
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: string;
  roughElement: Drawable;
  position?: string;
  offsetX?: number; // used for selection to displace the element from the point where it was clicked
  offsetY?: number; // used for selection to displace the element from the point where
  // for pencil
  offsetsX?: number[];
  offsetsY?: number[];
  points?: { x: number; y: number }[]; // used for pencil drawing
  // for text
  text?: string; // used for text drawing
};

function App() {
  const [action, setAction] = useState("none"); // drawing, selecting, resizing
  const [tool, setTooltype] = useState("line"); // rectangle, line, selection
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  // const [elements, setElements] = useState<Element[]>([]);
  const [elements, setElements, undo, redo] = useHistory([]);
  const [showInput, setShowInput] = useState(false); // true when we want to show the input box for text writing
  const textAreaRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // for panning the canvas
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const [pressedKeys, setPressedKeys] = useKeys();
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });
  usePreventZoom();

  const createElement = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    elementType: string,
    id?: string,
    txt?: any
  ): Element => {
    let roughElement: Drawable;
    let points = [];
    let Text: string | undefined = undefined;
    switch (elementType) {
      case "rectangle":
        roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
        break;
      case "line":
        roughElement = generator.line(x1, y1, x2, y2);
        break;
      case "circle":
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);

        roughElement = generator.circle(
          x1 + width / 2, // x-center
          y1 + height / 2, // y-center
          distanceFormula(x1, y1, x2, y2) // diameter
        );
        break;
      case "pencil":
        points.push({ x: x1, y: y1 });
        // For pencil, we can create a drawable path
        break;
      case "text":
        Text = txt;

      default:
        break;
    }

    return {
      id: !id ? generateId() : id,
      x1,
      y1,
      x2,
      y2,
      roughElement,
      type: elementType,
      // If it's a pencil, we will store the points
      points: elementType === "pencil" ? points : undefined,
      // For text
      text: elementType === "text" ? Text : undefined,
    };
  };

  const updateElement = (
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    elementType: string,
    text?: string
  ) => {
    let updatedElement: Element;
    if (elementType === "pencil") {
      const existingElement = elements.find((el: Element) => el.id === id);
      console.log(existingElement, "existing");
      existingElement["points"]?.push({ x: x2, y: y2 });
      updatedElement = existingElement;
    } else if (elementType === "text") {
      console.log(x2, y2, "2's");
      const existingElement = elements.find((el: Element) => el.id === id);
      console.log(existingElement, "existing");
      updatedElement = {
        ...existingElement,
        x1,
        y1,
        x2,
        y2,
        text: text, // update text if provided
      };
    } else {
      updatedElement = createElement(x1, y1, x2, y2, elementType, id);
    }
    const updatedElements = [...elements];
    const index = updatedElements.findIndex((el) => el.id === id);
    updatedElements[index] = updatedElement;
    console.log(updatedElements, "updatedElements");
    setElements(updatedElements, true); // overwrite the current state
  };
  // for updating the mouse cordinates according to panned offset and zoomed offset
  function getMouseCordinates(e: any): { clientX: any; clientY: any } {
    const clientX = (e.clientX - panOffset.x * scale + scaleOffset.x) / scale;
    const clientY = (e.clientY - panOffset.y * scale + scaleOffset.y) / scale;
    return { clientX, clientY };
  }
  // Rendering !
  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    // settings to find scale offsets, and zoom from the middle
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const scaleOffsetX = (scaledWidth - canvas.width) / 2;
    const scaleOffsetY = (scaledHeight - canvas.height) / 2;

    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });

    ctx?.save();
    // Pan according to the zoomed

    ctx?.translate(
      panOffset.x * scale - scaleOffsetX,
      panOffset.y * scale - scaleOffsetY
    );
    ctx?.scale(scale, scale);

    const roughtCanvas = rough.canvas(canvas);

    elements.forEach((element: Element) => {
      // if you're editing, dont render the element (that is actually present behind the text area)
      if (action === "writing" && selectedElement?.id === element.id) {
        console.log("skipping rendering for element", element.id);
        return;
      }
      // Add some y-axis if its the first text, (due to the painting bug)
      const firstText = elements.filter(
        (el) => el.type === "text"
      )[0] as Element;
      if (firstText && element.id === firstText.id) {
        drawingElement({ ...element, y1: element.y1 }, roughtCanvas, ctx);
      } else {
        drawingElement(element, roughtCanvas, ctx);
      }
    });
    ctx?.restore();
  }, [elements, action, panOffset, scale]);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (action === "writing" && textArea) {
      // Adding a bit dealy to solve rendering issue
      setTimeout(() => {
        textArea.focus();
        // for editing purposes
        textArea.value = selectedElement?.text || "";
        console.log("focused in timeout", textArea);
      }, 20);
    }
  }, [selectedElement, selectedElement, action]);

  // Changing the pan offset on wheel scroll
  useEffect(() => {
    const panOrZoomFunction = (event) => {
      event.preventDefault();
      if (pressedKeys.includes("Control") || pressedKeys.includes("Meta")) {
        console.log("ZOOMING");
        zoom(event.deltaY * -0.003);
      } else {
        setTooltype("pan");
        setPanOffset((prevState) => ({
          x: prevState.x - event.deltaX,
          y: prevState.y - event.deltaY,
        }));
      }
    };

    document.addEventListener("wheel", panOrZoomFunction);
    return () => {
      document.removeEventListener("wheel", panOrZoomFunction);
    };
  }, [pressedKeys]);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = getMouseCordinates(e);

    if (tool === "pan" || pressedKeys.includes(" ")) {
      setAction("panning");
      setStartPanPosition({ x: clientX, y: clientY });
      return;
    }

    if (tool === "selection") {
      // Handle selection logic here
      // check if clientX, and clientY are within the bounds of any existing element
      const selectedElement = findElementAtPosition(clientX, clientY, elements);
      // For moving/selecting
      if (selectedElement && selectedElement.position === "inside") {
        console.log("Element selected", selectedElement);
        let updatedSelectedElement = { ...selectedElement };
        // use of offset is necessary to displace the element from the point where it was clicked
        if (selectedElement.type === "pencil") {
          const points = selectedElement.points || [];
          // for a pencil movement, calculate x and y offset from each point to the mouse point, and update the element accordinly.
          const offsetsX = points.map((p) => clientX - p.x);
          const offsetsY = points.map((p) => clientY - p.y);
          updatedSelectedElement = {
            ...selectedElement,
            offsetsX: offsetsX,
            offsetsY: offsetsY,
          };
          setSelectedElement(updatedSelectedElement);
        } else {
          const offsetX = clientX - selectedElement.x1;
          const offsetY = clientY - selectedElement.y1;
          updatedSelectedElement = { ...selectedElement, offsetX, offsetY };
          setSelectedElement(updatedSelectedElement);
        }
        setAction("selecting");
        const updatedElements = elements.map((el) =>
          selectedElement.id === el.id ? updatedSelectedElement : el
        );
        setElements(updatedElements, false); // overwrite the current state
      }
      // For corner points (resizing)
      else if (
        selectedElement &&
        selectedElement.position !== "inside" &&
        selectedElement.position !== "outside"
      ) {
        setAction("resizing");
        setSelectedElement(selectedElement);
        // update the elements with selectedElement
        const updatedElements = elements.map((el) =>
          selectedElement.id === el.id ? selectedElement : el
        );
        setElements(updatedElements, false); // overwrite the current state
      }
    } else {
      console.log(clientX, clientY, "x,y");
      const element = createElement(
        clientX,
        clientY,
        clientX,
        clientY,
        tool,
        generateId(),
        ""
      );
      if (showInput) return; // (for writing case only) If input is shown, do not create a new element
      console.log("elem creatd with ", element.x1, element.y1);
      setSelectedElement(element);
      const updatedElements = [...elements, element];
      setElements(updatedElements);
      setAction(tool === "text" ? "writing" : "drawing");
    }
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = getMouseCordinates(e);
    // Either editing or creating new text
    if (
      action === "selecting" &&
      selectedElement &&
      clientX - selectedElement.offsetX === selectedElement.x1 &&
      clientY - selectedElement.offsetY === selectedElement.y1
    ) {
      console.log("text editing");
      if (!selectedElement) {
        const elem = findElementAtPosition(clientX, clientY, elements);
        elem && setSelectedElement(elem);
      }
      console.log("text editing");
      setShowInput(true);
      setAction("writing");
      return;
    }

    if (action === "drawing" && adjustmentRequired(tool)) {
      const index = elements.length - 1;
      const lastElement = elements[index];
      const { x1, y1, x2, y2 } = lastElement;
      console.log(x1, y1, x2, y2);

      const { x1: X, x2: Y, y1: X2, y2: Y2 } = adjustCordinates(lastElement);
      console.log(X, X2, Y, Y2, "news");

      updateElement(lastElement.id, X, X2, Y, Y2, lastElement.type);
      console.log("updated!");
    }
    // also adjust cordinates while resizing, to keep reseting x,y as convention.
    else if (action === "resizing" && selectedElement) {
      console.log(
        selectedElement.x1,
        selectedElement.y1,
        selectedElement.x2,
        selectedElement.y2,
        "HEH"
      );
      const {
        x1: X,
        x2: Y,
        y1: X2,
        y2: Y2,
      } = adjustCordinates(selectedElement);
      updateElement(selectedElement.id, X, X2, Y, Y2, selectedElement.type);
    }
    // Dont reset when you're writing
    if (action !== "writing") {
      setAction("none");
      setSelectedElement(null);
    }
    // When writing, we dont want to leave writing when mouse is up
    // MouseDown makes it writing, but mouse up should not change it (bascially solves the timing problem)
    if (action === "writing") {
      console.log("JUST RAN");
      setShowInput(true);
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = getMouseCordinates(e);

    // Hover logic
    if (tool === "selection") {
      const position = findElementAtPosition(
        clientX,
        clientY,
        elements
      )?.position;
      let cursor;
      switch (position) {
        case "up":
        case "down":
          cursor = "ns-resize";
          break;
        case "inside":
          cursor = "move";
          break;
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
    // Actual movement/drawing logic
    if (action === "drawing") {
      // setPoints([...points, [e.pageX, e.pageY, e.pressure]])

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
    } else if (action === "selecting" && selectedElement) {
      console.log("dragging element");
      if (selectedElement.type === "pencil") {
        const { offsetsX = [], offsetsY = [] } = selectedElement;
        const points = selectedElement.points || [];
        const newPoints = points.map((point, index) => {
          return {
            x: clientX - offsetsX[index],
            y: clientY - offsetsY[index],
          };
        });
        const existingElement = elements.find(
          (el) => el.id === selectedElement.id
        );
        console.log(existingElement, "existing");
        existingElement["points"] = newPoints;
        const updatedElement = existingElement;
        const updatedElements = [...elements];
        const index = updatedElements.findIndex(
          (el) => el.id === selectedElement.id
        );
        updatedElements[index] = updatedElement;
        console.log(updatedElements, "updatedElements");
        setElements(updatedElements, true); // overwrite the current state
      } else {
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
          selectedElement.type,
          selectedElement.text
        );
      }
    } else if (action === "resizing" && selectedElement) {
      if (selectedElement.type === "circle") {
        console.log("resizing circle");
        // increase or decrease the radius of selectedElement, depending
        // whether the mouse is moving inwards or outwards
        // x1, y1, x2, y2 are the cordinates of circle (top left and bottom right corner)
        const { x1, y1, x2, y2 } = selectedElement;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const newRadius = distanceFormula(centerX, centerY, clientX, clientY);
        const newx2 = x1 + newRadius * Math.sqrt(2);
        const newy2 = y1 + newRadius * Math.sqrt(2);
        updateElement(selectedElement.id, x1, y1, newx2, newy2, tool);
        setSelectedElement({
          ...selectedElement,
          x1,
          y1,
          x2: newx2,
          y2: newy2,
        });
      } else {
        const { x1, y1, x2, y2, position } = selectedElement;
        const cordinates = { x1, y1, x2, y2 };
        const { X1, Y1, X2, Y2 } = resizedCordinates(
          cordinates,
          clientX,
          clientY,
          position
        );

        updateElement(selectedElement.id, X1, Y1, X2, Y2, selectedElement.type);
        setSelectedElement({
          ...selectedElement,
          x1: X1,
          y1: Y1,
          x2: X2,
          y2: Y2,
        });
      }
    } else if (action === "panning") {
      const canvas = document.getElementById("canvas") as HTMLCanvasElement;
      canvas.style.cursor = action === "panning" ? "grabbing" : "grab";
      // NOW you're panning
      const deltaX = clientX - startPanPosition.x;
      const deltaY = clientY - startPanPosition.y;
      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY,
      });
      return;
    }
  };

  const onBlur = (e) => {
    console.log("onBlur called");
    const { value } = e.target;

    // calculate x2, y2 for the text
    const textWidth =
      document.getElementById("canvas").getContext("2d")?.measureText(value)
        .width * 2.4;
    console.log(selectedElement?.x1, textWidth, "X ");
    const textHeight = 24; // rough estimate of text height
    updateElement(
      selectedElement?.id || "",
      selectedElement?.x1,
      selectedElement?.y1,
      selectedElement?.x1 + textWidth,
      selectedElement?.y1 + textHeight,
      "text",
      value || ""
    );
    setAction("none");
    setSelectedElement(null);
    setShowInput(false);
  };

  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    if (tool === "pan") {
      canvas.style.cursor = action === "panning" ? "grabbing" : "grab";
    } else if (tool === "text" && action !== "writing") {
      canvas.style.cursor = "text";
    } else {
      canvas.style.cursor = "default";
    }
  }, [tool, action]);

  useEffect(() => {
    const undoRedoFunction = (event: KeyboardEvent) => {
      const isUndoRedoCombo = event.metaKey || event.ctrlKey;

      if (isUndoRedoCombo) {
        if (event.key.toLowerCase() === "y") {
          redo();
        } else if (event.key.toLowerCase() === "z") {
          undo();
        }
      }
    };

    document.addEventListener("keydown", undoRedoFunction);

    return () => {
      document.removeEventListener("keydown", undoRedoFunction);
    };
  }, [undo, redo]);

  const zoom = (x: number) => {
    setScale(Math.max(scale + x, 0.1));
  };

  return (
    <div className="p-0 m-0 box-border">
      <div className="absolute z-10">
        <div className=" top-5 left-5 flex justify-center items-center space-x-4 mb-4">
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
              value="pencil"
              checked={tool === "pencil"}
              onChange={(e) => setTooltype(e.target.value)}
            />
            Pencil{" "}
          </label>
          <label>
            <input
              type="radio"
              value="circle"
              checked={tool === "circle"}
              onChange={(e) => setTooltype(e.target.value)}
            />
            Circle{" "}
          </label>
          <label>
            <input
              type="radio"
              value="text"
              checked={tool === "text"}
              onChange={(e) => setTooltype(e.target.value)}
            />
            Text{" "}
          </label>
          <label>
            <input
              type="radio"
              value="pan"
              checked={tool === "pan"}
              onChange={(e) => setTooltype(e.target.value)}
            />
            Pan{" "}
          </label>

          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
          <button onClick={() => zoom(-0.1)}>-</button>
          <button>{Math.floor(scale * 100)}%</button>
          <button onClick={() => zoom(0.1)}>+</button>
        </div>
        {action === "writing" && showInput && (
          // Adjust the text area position acording to panned and zoomed condition
          <textarea
            ref={textAreaRef}
            style={{
              position: "fixed",
              top:
                (selectedElement?.y1 - 2) * scale +
                panOffset.y * scale -
                scaleOffset.y,
              left:
                selectedElement?.x1 * scale +
                panOffset.x * scale -
                scaleOffset.x,
              font: `${24 * scale}px sans-serif`,
              margin: 0,
              padding: 0,
              border: 0,
              outline: 0,
              resize: "auto",
              overflow: "hidden",
              whiteSpace: "pre",
              background: "transparent",
            }}
            className="bg-yellow-50"
            autoFocus
            onBlur={onBlur}
          />
        )}
      </div>
      <canvas
        id="canvas"
        width={window.innerWidth - 3}
        height={window.innerHeight - 3}
        className="absolute top-0 left-0"
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      ></canvas>
    </div>
  );
}

export default App;
