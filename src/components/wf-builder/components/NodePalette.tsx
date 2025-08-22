import React from "react";
import { nodes } from "../nodes";
import { NodePaletteProps, NodeType } from "../types";

interface DraggableNodeItemProps {
  nodeType: NodeType;
  label: string;
  icon: string;
  description: string;
  category: string;
  isSelected: boolean;
  onClick: () => void;
}

const DraggableNodeItem: React.FC<DraggableNodeItemProps> = ({
  nodeType,
  label,
  icon,
  description,
  category,
  isSelected,
  onClick,
}) => {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ nodeType })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        p-3 border-2 rounded-lg cursor-grab transition-all duration-200
        ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50"
        }
        hover:shadow-md active:cursor-grabbing
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {label}
          </div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NodePalette: React.FC<NodePaletteProps> = ({
  onNodeSelect,
  selectedNodeType,
  isAddingNode,
  onCancelAdd,
}) => {
  // Group nodes by category
  const nodesByCategory = React.useMemo(() => {
    const groups: Record<string, any[]> = {};

    // Use the exported nodes array for dynamic node loading
    nodes.forEach((nodeDefinition) => {
      const category = nodeDefinition.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({
        nodeType: nodeDefinition.type,
        ...nodeDefinition,
      });
    });

    return groups;
  }, []);

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Node Types</h3>
        {isAddingNode && (
          <button
            onClick={onCancelAdd}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Cancel Adding Node
          </button>
        )}
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(nodesByCategory).map(([category, nodes]) => (
          <div key={category}>
            <h4 className="font-medium text-xs uppercase text-gray-500 mb-3 tracking-wide">
              {category}
            </h4>
            <div className="space-y-2">
              {nodes.map((node) => (
                <DraggableNodeItem
                  key={node.nodeType}
                  nodeType={node.nodeType}
                  label={node.label}
                  icon={node.icon}
                  description={node.description}
                  category={category}
                  isSelected={selectedNodeType === node.nodeType}
                  onClick={() => onNodeSelect(node.nodeType)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// test 