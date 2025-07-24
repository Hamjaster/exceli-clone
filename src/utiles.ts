import type { Element } from "./App";

export function findElementAtPosition(x: number, y: number, elements: Element[]) {
    return elements.find(element => isWithinElement(x, y, element));
}

const isWithinElement = (x: number, y: number, element: Element) => {
    
}