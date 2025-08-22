/**
 * Optimized workflow node component with smooth interactions
 */

import { Handle, Position } from "@xyflow/react";
import React, { memo, useCallback, useState } from "react";
import { getNodeConfig } from "../nodeConfigs";
import { NodeType } from "../types";

interface WorkflowNodeProps {
  data: {
    nodeId: string;
    nodeType: NodeType;
    label: string;
    config: Record<string, any>;
    isSelected: boolean;
    needsConnection: boolean;
    missingHandles: string[];
    onAddNode?: (
      nodeId: string,
      direction: "top" | "bottom" | "left" | "right"
    ) => void;
  };
}

const WorkflowNode = memo<WorkflowNodeProps>(({ data }) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = getNodeConfig(data.nodeType);

  const getPositionFromString = (pos: string): Position => {
    switch (pos) {
      case "top":
        return Position.Top;
      case "bottom":
        return Position.Bottom;
      case "left":
        return Position.Left;
      case "right":
        return Position.Right;
      default:
        return Position.Right;
    }
  };

  const getNodeStyle = useCallback(() => {
    const baseClasses =
      "px-4 py-3 rounded-lg border-2 min-w-[140px] text-center transition-all duration-300 shadow-sm relative group select-none";

    let typeClasses = "";
    switch (data.nodeType) {
      case "StartNode":
        typeClasses =
          "bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-800";
        break;
      case "ConditionNode":
        typeClasses =
          "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 text-yellow-800";
        break;
      case "AddTaskNode":
        typeClasses =
          "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-800";
        break;
      case "AddTaskNode":
        typeClasses =
          "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 text-orange-800";
        break;
      default:
        typeClasses =
          "bg-gradient-to-br from-white to-gray-50 border-gray-300 text-gray-800";
    }

    const stateClasses = [
      data.isSelected
        ? "ring-2 ring-blue-400 ring-opacity-75 shadow-lg scale-105"
        : "",
      data.needsConnection
        ? "ring-2 ring-red-400 ring-opacity-75 animate-pulse"
        : "",
      isHovered ? "shadow-lg transform scale-105" : "",
      "cursor-move",
    ]
      .filter(Boolean)
      .join(" ");

    return `${baseClasses} ${typeClasses} ${stateClasses}`;
  }, [data.nodeType, data.isSelected, data.needsConnection, isHovered]);

  const getHandleStyle = useCallback(
    (handleId: string, handleType: "input" | "output") => {
      const baseStyle = {
        width: "14px",
        height: "14px",
        border: "3px solid #ffffff",
        borderRadius: "50%",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      };

      // Highlight missing required handles
      if (data.missingHandles.includes(handleId)) {
        return {
          ...baseStyle,
          backgroundColor: "#ef4444",
          boxShadow: "0 0 12px rgba(239, 68, 68, 0.8)",
          animation: "pulse 1.5s infinite",
          transform: "scale(1.2)",
        };
      }

      if (handleType === "input") {
        return { ...baseStyle, backgroundColor: "#6b7280" };
      }

      // Special colors for condition node outputs
      if (data.nodeType === "ConditionNode") {
        return {
          ...baseStyle,
          backgroundColor: handleId === "true" ? "#10b981" : "#ef4444",
        };
      }

      return { ...baseStyle, backgroundColor: "#3b82f6" };
    },
    [data.missingHandles, data.nodeType]
  );

  const handleAddNode = useCallback(
    (e: React.MouseEvent, direction: "top" | "bottom" | "left" | "right") => {
      e.stopPropagation();
      e.preventDefault();
      if (data.onAddNode) {
        data.onAddNode(data.nodeId, direction);
      }
    },
    [data.onAddNode, data.nodeId]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div
      className={getNodeStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: "grab" }}
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).closest(".node-content")
        ) {
          e.currentTarget.style.cursor = "grabbing";
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.cursor = "grab";
      }}
    >
      {/* Render handles based on node configuration */}
      {config.handles.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type === "input" ? "target" : "source"}
          position={getPositionFromString(handle.position)}
          id={handle.id}
          style={getHandleStyle(handle.id, handle.type)}
          isConnectable={true}
          className="transition-all duration-200 hover:scale-110"
        />
      ))}

      {/* Node content */}
      <div className="node-content flex flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-2">
          <span
            className="text-lg transition-transform duration-200 hover:scale-110"
            role="img"
            aria-label={config.label}
          >
            {config.icon}
          </span>
          <span className="font-medium text-sm">{data.label}</span>
        </div>

        {/* Show additional info based on node type */}
        {data.nodeType === "AddTaskNode" &&
          data.config.priority &&
          data.config.priority !== "medium" && (
            <div
              className={`text-xs font-medium ${
                data.config.priority === "urgent"
                  ? "text-red-600"
                  : data.config.priority === "high"
                  ? "text-orange-600"
                  : "text-green-600"
              }`}
            >
              {data.config.priority.toUpperCase()}
            </div>
          )}

        {data.nodeType === "ConditionNode" &&
          data.config.conditions &&
          data.config.conditions.length > 0 && (
            <div className="text-xs text-yellow-600">
              {data.config.conditions.length} condition
              {data.config.conditions.length !== 1 ? "s" : ""}
            </div>
          )}
      </div>

      {/* Add Node Buttons - Only show on hover */}
      {data.onAddNode && (
        <>
          {/* Right button */}
          <div
            className={`absolute -right-8 top-1/2 transform -translate-y-1/2 transition-all duration-200 z-20 ${
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <button
              onClick={(e) => handleAddNode(e, "right")}
              className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-blue-600 shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white"
              title="Add node to the right"
            >
              +
            </button>
          </div>

          {/* Left button */}
          <div
            className={`absolute -left-8 top-1/2 transform -translate-y-1/2 transition-all duration-200 z-20 ${
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <button
              onClick={(e) => handleAddNode(e, "left")}
              className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-blue-600 shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white"
              title="Add node to the left"
            >
              +
            </button>
          </div>

          {/* Top/Bottom buttons for condition nodes */}
          {data.nodeType === "ConditionNode" && (
            <>
              <div
                className={`absolute -top-8 left-1/2 transform -translate-x-1/2 transition-all duration-200 z-20 ${
                  isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
                }`}
              >
                <button
                  onClick={(e) => handleAddNode(e, "top")}
                  className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-green-600 shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white"
                  title="Add node to true branch"
                >
                  +
                </button>
              </div>

              <div
                className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-200 z-20 ${
                  isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
                }`}
              >
                <button
                  onClick={(e) => handleAddNode(e, "bottom")}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white"
                  title="Add node to false branch"
                >
                  +
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Condition node labels */}
      {data.nodeType === "ConditionNode" && (
        <>
          <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-green-600 font-bold bg-white px-2 py-1 rounded-full shadow-sm border border-green-200">
            TRUE
          </div>
          <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-bold bg-white px-2 py-1 rounded-full shadow-sm border border-red-200">
            FALSE
          </div>
        </>
      )}

      {/* Connection requirement indicator */}
      {data.needsConnection && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full z-30">
          <div className="bg-red-100 border border-red-300 rounded-full px-3 py-1 text-xs text-red-700 whitespace-nowrap shadow-lg animate-bounce">
            ⚠ Missing connections
          </div>
        </div>
      )}
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";

export { WorkflowNode };
