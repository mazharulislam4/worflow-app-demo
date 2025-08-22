import React from "react";
import { getNodeDefinition } from "../nodes";
import { NodeType, WorkflowNode as WorkflowNodeType } from "../types";

interface EnhancedWorkflowNodeProps {
  data: WorkflowNodeType["data"] & {
    nodeId: string;
    nodeType: NodeType;
    isSelected: boolean;
    needsConnection: boolean;
    missingHandles: string[];
  };
  onAddNode?: (
    nodeId: string,
    direction: "top" | "bottom" | "left" | "right"
  ) => void;
}

/**
 * Enhanced Workflow Node Component
 * Dynamically renders the appropriate node component based on node type
 */
export const EnhancedWorkflowNode: React.FC<EnhancedWorkflowNodeProps> = ({
  data,
  onAddNode,
}) => {
  const nodeDefinition = getNodeDefinition(data.nodeType);

  if (!nodeDefinition) {
    // Fallback for unknown node types
    return (
      <div className="px-4 py-3 rounded-lg border-2 border-red-300 bg-red-50 text-red-800 min-w-[140px] text-center">
        <div className="text-sm font-medium">Unknown Node</div>
        <div className="text-xs opacity-75">{data.nodeType}</div>
      </div>
    );
  }

  const NodeComponent = nodeDefinition.component;

  const handleAddNode = (direction: "top" | "bottom" | "left" | "right") => {
    if (onAddNode) {
      onAddNode(data.nodeId, direction);
    }
  };

  // Merge default config with actual config to ensure all required fields are present
  const nodeData = {
    ...data,
    config: {
      ...nodeDefinition.defaultConfig,
      ...data.config,
    },
  } as any; // Use any to bypass strict typing for now

  return <NodeComponent data={nodeData} onAddNode={handleAddNode} />;
};
