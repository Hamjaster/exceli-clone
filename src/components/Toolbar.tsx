"use client";

import { useState } from "react";
import {
  Lock,
  Hand,
  MousePointer2,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  Image,
  EraserIcon as Eraser2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
  activeTool?: string;
  onToolChange?: (tool: string) => void;
}

const tools = [
  { id: "pan", icon: Hand, label: "Hand" },
  { id: "selection", icon: MousePointer2, label: "Select" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "pencil", icon: Pencil, label: "Pencil" },
  { id: "text", icon: Type, label: "Text" },
  { id: "eraser", icon: Eraser2, label: "Eraser" },
];

export default function CanvasToolbar({
  activeTool = "select",
  onToolChange,
}: ToolbarProps) {
  const [selectedTool, setSelectedTool] = useState(activeTool);

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    onToolChange?.(toolId);
  };

  return (
    <div className="absolute z-10 top-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
      {/* Main Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-3">
        <div className="flex items-center gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = selectedTool === tool.id;

            return (
              <Button
                key={tool.id}
                variant="ghost"
                size="sm"
                className={`h-12 w-12 p-0 rounded-md transition-all duration-150 ${
                  isActive
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
                onClick={() => handleToolClick(tool.id)}
                title={tool.label}
              >
                <Icon className="h-10 w-10" strokeWidth={2} />
              </Button>
            );
          })}
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-sm text-gray-500 max-w-md text-center">
        To move canvas, hold spacebar while dragging, or use the hand tool
      </div>
    </div>
  );
}
