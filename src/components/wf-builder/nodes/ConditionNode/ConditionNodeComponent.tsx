import { Handle, Position } from "@xyflow/react";
import React from "react";
import { WorkflowNode } from "../../types";
import { ConditionNodeConfig } from "./schema";

interface ConditionNodeComponentProps {
  data: WorkflowNode["data"] & {
    nodeId: string;
    isSelected: boolean;
    needsConnection: boolean;
    missingHandles: string[];
    config: ConditionNodeConfig;
  };
  onAddNode?: (direction: "top" | "bottom" | "left" | "right") => void;
}

export const ConditionNodeComponent: React.FC<ConditionNodeComponentProps> = ({
  data,
  onAddNode,
}) => {
  const baseClasses =
    "px-3 py-2 rounded-lg border-2 w-[180px] h-[60px] flex items-center justify-center transition-all duration-200 shadow-sm relative group";
  const typeClasses = "bg-yellow-50 border-yellow-300 text-yellow-800";
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
    <div className={`${baseClasses} ${typeClasses} ${stateClasses} relative`}>
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

      {/* True output handle */}
      <Handle
        type="source"
        position={Position.Top}
        id="true"
        style={{
          width: "12px",
          height: "12px",
          border: "2px solid #ffffff",
          borderRadius: "50%",
          backgroundColor: "#10b981",
          top: "-6px",
        }}
        isConnectable={true}
      />

      {/* False output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{
          width: "12px",
          height: "12px",
          border: "2px solid #ffffff",
          borderRadius: "50%",
          backgroundColor: "#ef4444",
          bottom: "-6px",
        }}
        isConnectable={true}
      />

      {/* Node content */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="Condition">
            🔀
          </span>
          <span className="font-medium text-sm">{data.label}</span>
        </div>

        {/* Show condition count */}
        {data.config.conditions && data.config.conditions.length > 0 && (
          <div className="text-xs opacity-75">
            {data.config.conditions.length} condition
            {data.config.conditions.length !== 1 ? "s" : ""}
            {data.config.logic &&
              data.config.conditions.length > 1 &&
              ` (${data.config.logic})`}
          </div>
        )}
      </div>

      {/* Handle labels - positioned correctly with True at top, False at bottom */}
      {/* <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[8px] text-green-600 font-bold bg-white px-2 py-1 rounded shadow-sm border border-green-300">
        True
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-[8px] text-red-600  bg-white px-2 py-1 rounded shadow-sm border border-red-300">
        <p>False</p>
      </div> */}

      {/* Mini toolbar for adding nodes */}
      {onAddNode && (
        <>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddNode("top")}
              className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-green-600"
              title="Add node to true branch"
            >
              +
            </button>
          </div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddNode("bottom")}
              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              title="Add node to false branch"
            >
              +
            </button>
          </div>
          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddNode("left")}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
              title="Add node before condition"
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
