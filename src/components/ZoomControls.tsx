import React from "react";
import { Button } from "./ui/button";
import { Minus, Plus, Redo2, Undo2 } from "lucide-react";

export default function ZoomControls({
  zoom,
  scale,
  undo,
  redo,
}: {
  zoom: (x: number) => void;
  scale: number;
  undo: () => void;
  redo: () => void;
}) {
  return (
    <div>
      <div className="absolute z-10 bottom-5 left-5 flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-1 flex items-center">
          <Button
            onClick={() => zoom(-0.1)}
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-2 hover:bg-purple-100 text-gray-700"
          >
            <Minus className="h-6 w-6" strokeWidth={2} />
          </Button>

          <div className="px-3 py-1 text-md font-medium text-gray-700 min-w-[50px] text-center">
            {Math.floor(scale * 100)}%
          </div>

          <Button
            onClick={() => zoom(0.1)}
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-2 hover:bg-purple-100 text-gray-700"
          >
            <Plus className="h-6 w-6" strokeWidth={2} />
          </Button>
        </div>

        {/* History Controls */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-1 flex items-center gap-1">
          <Button
            onClick={undo}
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 hover:bg-gray-100 text-gray-700"
            title="Undo"
          >
            <Undo2 className="h-3 w-3" strokeWidth={2} />
          </Button>

          <Button
            onClick={redo}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-gray-100 text-gray-700"
            title="Redo"
          >
            <Redo2 className="h-3 w-3" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
