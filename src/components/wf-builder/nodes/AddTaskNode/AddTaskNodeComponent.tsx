import { Handle, Position } from "@xyflow/react";
import React from "react";
import { WorkflowNode } from "../../types";
import { AddTaskNodeConfig } from "./schema";

interface AddTaskNodeComponentProps {
  data: WorkflowNode["data"] & {
    nodeId: string;
    isSelected: boolean;
    needsConnection: boolean;
    missingHandles: string[];
    config: AddTaskNodeConfig;
  };
  onAddNode?: (direction: "top" | "bottom" | "left" | "right") => void;
}

export const AddTaskNodeComponent: React.FC<AddTaskNodeComponentProps> = ({
  data,
  onAddNode,
}) => {
  const baseClasses =
    "px-3 py-2 rounded-lg border-2 w-[180px] h-[60px] flex items-center justify-center transition-all duration-200 shadow-sm relative group";
  const typeClasses = "bg-orange-50 border-orange-300 text-orange-800";
  const stateClasses = [
    data.isSelected ? "ring-2 ring-blue-400 ring-opacity-75" : "",
    data.needsConnection
      ? "ring-2 ring-red-400 ring-opacity-75 animate-pulse"
      : "",
    "hover:shadow-md",
  ]
    .filter(Boolean)
    .join(" ");

  const priorityColors = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-orange-600",
    urgent: "text-red-600",
  };

  return (
    <div className={`${baseClasses} ${typeClasses} ${stateClasses}`}>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          width: "12px",
          height: "12px",
          border: "2px solid #ffffff",
          borderRadius: "50%",
          backgroundColor: "#6b7280",
        }}
        isConnectable={true}
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          width: "12px",
          height: "12px",
          border: "2px solid #ffffff",
          borderRadius: "50%",
          backgroundColor: "#3b82f6",
        }}
        isConnectable={true}
      />

      {/* Node content */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="Add Task">
            ✓
          </span>
          <span className="font-medium text-sm">{data.label}</span>
        </div>

        {/* Show task title if configured */}
        {data.config.title && (
          <div className="text-xs opacity-75 truncate max-w-[120px]">
            {data.config.title}
          </div>
        )}

        {/* Show priority indicator */}
        {data.config.priority && data.config.priority !== "medium" && (
          <div
            className={`text-xs ${
              priorityColors[data.config.priority]
            } font-medium`}
          >
            {data.config.priority.toUpperCase()}
          </div>
        )}
      </div>

      {/* Mini toolbar for adding nodes */}
      {onAddNode && (
        <>
          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddNode("right")}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
              title="Add node to the right"
            >
              +
            </button>
          </div>
          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddNode("left")}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
              title="Add node to the left"
            >
              +
            </button>
          </div>
        </>
      )}

      {/* Connection requirement indicator */}
      {data.needsConnection && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full">
          <div className="bg-red-100 border border-red-300 rounded px-2 py-1 text-xs text-red-700 whitespace-nowrap">
            Missing connections
          </div>
        </div>
      )}
    </div>
  );
};
