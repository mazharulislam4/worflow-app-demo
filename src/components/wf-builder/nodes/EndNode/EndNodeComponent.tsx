import { Handle, Position } from "@xyflow/react";
import React from "react";
import { WorkflowNode } from "../../types";

// Define EndNodeConfig inline for now to avoid import issues
interface EndNodeConfig {
  nodeType: "EndNode";
  label: string;
  description?: string;
}

interface EndNodeComponentProps {
  data: WorkflowNode["data"] & {
    nodeId: string;
    isSelected: boolean;
    needsConnection: boolean;
    missingHandles: string[];
    config: EndNodeConfig;
  };
  onAddNode?: (direction: "top" | "bottom" | "left" | "right") => void;
}

export const EndNodeComponent: React.FC<EndNodeComponentProps> = ({
  data,
  onAddNode,
}) => {
  const baseClasses =
    "px-3 py-2 rounded-lg border-2 w-[180px] h-[60px] flex items-center justify-center transition-all duration-200 shadow-sm relative group";
  const typeClasses = "bg-red-50 border-red-300 text-red-800";
  const stateClasses = [
    data.isSelected ? "ring-2 ring-blue-400 ring-opacity-75" : "",
    data.needsConnection
      ? "ring-2 ring-red-400 ring-opacity-75 animate-pulse"
      : "",
    "hover:shadow-md",
  ]
    .filter(Boolean)
    .join(" ");

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

      {/* Node content */}
      <div className="flex items-center gap-2">
        <span className="text-lg" role="img" aria-label="End">
          🏁
        </span>
        <span className="font-medium text-sm truncate min-w-0 flex-shrink-0">
          {data.label}
        </span>
      </div>

      {/* Mini toolbar for adding nodes */}
      {onAddNode && (
        <>
          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddNode("left")}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
              title="Add node before end"
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
