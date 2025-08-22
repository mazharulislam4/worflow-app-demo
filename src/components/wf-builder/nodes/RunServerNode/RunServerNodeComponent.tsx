import { Handle, Position } from "@xyflow/react";
import React from "react";
import { WorkflowNodeProps } from "../../types";

export const RunServerNodeComponent: React.FC<WorkflowNodeProps> = ({ data }) => {
  const { label, config, isSelected, needsConnection } = data;

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-md bg-white border-2 ${
        isSelected
          ? "border-blue-500"
          : needsConnection
          ? "border-yellow-400"
          : "border-gray-200"
      } w-[180px] h-[60px] flex items-center`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm">🚀</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {label}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {config.app_type || "node"} Server
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="w-3 h-3 !bg-green-400 border-2 border-white"
      />
    </div>
  );
};
