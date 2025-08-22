"use client";

import {
  Background,
  Connection,
  ConnectionLineType,
  ConnectionMode,
  Controls,
  Edge,
  MiniMap,
  Node,
  Panel,
  ReactFlow,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { AddTaskNodeComponent } from "../nodes/AddTaskNode/AddTaskNodeComponent";
import { APICallNodeComponent } from "../nodes/APICallNode/APICallNodeComponent";
import { ConditionNodeComponent } from "../nodes/ConditionNode/ConditionNodeComponent";
import { EndNodeComponent } from "../nodes/EndNode/EndNodeComponent";
import { RunServerNodeComponent } from "../nodes/RunServerNode/RunServerNodeComponent";
import { RunVMNodeComponent } from "../nodes/RunVMNode/RunVMNodeComponent";
import { ScriptNodeComponent } from "../nodes/ScriptNode/ScriptNodeComponent";
import { SendEmailNodeComponent } from "../nodes/SendEmailNode/SendEmailNodeComponent";
import { StartNodeComponent } from "../nodes/StartNode/StartNodeComponent";
import { NodeType, WorkflowEdge, WorkflowNode } from "../types";

// Props interface for WorkflowCanvas
interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeAdd: (type: NodeType, position: { x: number; y: number }) => void;
  onEdgeAdd: (
    fromNodeId: string,
    outputHandle: string,
    toNodeId: string,
    inputHandle: string
  ) => boolean;
  onEdgeDelete: (edgeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

// Custom node types mapping
const nodeTypes = {
  StartNode: StartNodeComponent,
  AddTaskNode: AddTaskNodeComponent,
  ConditionNode: ConditionNodeComponent,
  APICallNode: APICallNodeComponent,
  ScriptNode: ScriptNodeComponent,
  runVM: RunVMNodeComponent,
  runServer: RunServerNodeComponent,
  SendEmailNode: SendEmailNodeComponent,
  EndNode: EndNodeComponent,
};

/**
 * Tree structure validation utilities
 */
class TreeValidator {
  /**
   * Check if adding a connection would create a cycle
   */
  static wouldCreateCycle(
    edges: Edge[],
    sourceId: string,
    targetId: string
  ): boolean {
    // Create adjacency list
    const graph = new Map<string, string[]>();

    // Add existing edges
    edges.forEach((edge) => {
      if (!graph.has(edge.source)) graph.set(edge.source, []);
      graph.get(edge.source)!.push(edge.target);
    });

    // Add the proposed edge
    if (!graph.has(sourceId)) graph.set(sourceId, []);
    graph.get(sourceId)!.push(targetId);

    // DFS to detect cycle
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    // Check all nodes for cycles
    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId) && hasCycle(nodeId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a node already has a parent (to enforce tree structure)
   */
  static hasParent(edges: Edge[], targetId: string): boolean {
    return edges.some((edge) => edge.target === targetId);
  }

  /**
   * Find root nodes (nodes with no parents)
   */
  static findRootNodes(nodes: Node[], edges: Edge[]): string[] {
    const nodesWithParents = new Set(edges.map((edge) => edge.target));
    return nodes
      .filter((node) => !nodesWithParents.has(node.id))
      .map((node) => node.id);
  }

  /**
   * Validate entire tree structure with support for conditional branching
   */
  static validateTree(
    nodes: Node[],
    edges: Edge[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Only validate if we have nodes
    if (nodes.length === 0) {
      return { isValid: true, errors: [] };
    }

    // Check for nodes with multiple parents (but allow conditional branching)
    const targetCounts = new Map<string, number>();
    const conditionalTargets = new Set<string>();

    edges.forEach((edge) => {
      targetCounts.set(edge.target, (targetCounts.get(edge.target) || 0) + 1);

      // Track targets that come from conditional nodes
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (
        sourceNode?.type === "ConditionNode" &&
        (edge.sourceHandle === "true" || edge.sourceHandle === "false")
      ) {
        conditionalTargets.add(edge.target);
      }
    });

    for (const [nodeId, count] of targetCounts.entries()) {
      // Allow multiple parents only if they come from conditional nodes
      if (count > 1 && !conditionalTargets.has(nodeId)) {
        const node = nodes.find((n) => n.id === nodeId);
        errors.push(
          `Node "${
            node?.data?.label || nodeId.slice(-8)
          }" has multiple parents from non-conditional sources. Each node can only have one parent, unless connected through conditional branching.`
        );
      }
    }

    // Check for cycles (more comprehensive check)
    if (this.detectCycles(nodes, edges)) {
      errors.push("Workflow contains cycles. Tree structure must be acyclic.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect cycles in the graph using DFS
   */
  static detectCycles(nodes: Node[], edges: Edge[]): boolean {
    const graph = new Map<string, string[]>();

    // Build adjacency list
    nodes.forEach((node) => graph.set(node.id, []));
    edges.forEach((edge) => {
      if (!graph.has(edge.source)) graph.set(edge.source, []);
      graph.get(edge.source)!.push(edge.target);
    });

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId) && hasCycle(nodeId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Build hierarchical tree structure from flat nodes/edges
   */
  static buildTreeStructure(nodes: Node[], edges: Edge[]) {
    const nodeMap = new Map(
      nodes.map((node) => [node.id, { ...node, subnodes: [] as any[] }])
    );
    const roots: any[] = [];

    // Create parent-child relationships
    edges.forEach((edge) => {
      const parent = nodeMap.get(edge.source);
      const child = nodeMap.get(edge.target);

      if (parent && child) {
        parent.subnodes.push(child);
      }
    });

    // Find root nodes
    const rootIds = this.findRootNodes(nodes, edges);
    rootIds.forEach((rootId) => {
      const rootNode = nodeMap.get(rootId);
      if (rootNode) {
        roots.push(rootNode);
      }
    });

    return { jobs: roots };
  }
}

/**
 * Tree-structure workflow canvas with validation
 */
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes: workflowNodes,
  edges: workflowEdges,
  selectedNodeId,
  onNodeSelect,
  onNodeMove,
  onNodeAdd,
  onEdgeAdd,
  onEdgeDelete,
  onDeleteNode,
}) => {
  // ReactFlow instance and wrapper ref
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Local state for validation errors
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  // Convert workflow nodes to React Flow format
  const reactFlowNodes: Node[] = useMemo(() => {
    return workflowNodes
      .filter((node) => !node.data.config?.isVirtualRoot) // Hide virtual root nodes
      .map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node.data,
          onDelete: () => onDeleteNode(node.id),
        },
        selected: selectedNodeId === node.id,
        style:
          selectedNodeId === node.id
            ? {
                border: "2px solid #3b82f6",
                boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
              }
            : undefined,
      }));
  }, [workflowNodes, selectedNodeId, onDeleteNode]);

  // Convert workflow edges to React Flow format with better styling
  const reactFlowEdges: Edge[] = useMemo(() => {
    return workflowEdges
      .filter((edge) => {
        // Hide edges connected to virtual root nodes
        const sourceNode = workflowNodes.find((n) => n.id === edge.from);
        const targetNode = workflowNodes.find((n) => n.id === edge.to);
        return (
          !sourceNode?.data.config?.isVirtualRoot &&
          !targetNode?.data.config?.isVirtualRoot
        );
      })
      .map((edge) => {
        // Color edges based on source handle (for conditional nodes)
        let edgeStyle = {
          stroke: "#6b7280",
          strokeWidth: 2,
        };

        if (edge.output === "true") {
          edgeStyle = {
            stroke: "#16a34a",
            strokeWidth: 2,
          };
        } else if (edge.output === "false") {
          edgeStyle = {
            stroke: "#dc2626",
            strokeWidth: 2,
          };
        }

        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          sourceHandle: edge.output,
          targetHandle: edge.input,
          type: "smoothstep",
          animated: false,
          style: edgeStyle,
        };
      });
  }, [workflowEdges, workflowNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Sync React Flow nodes/edges with workflow state
  React.useEffect(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  React.useEffect(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);

  // Validate tree structure whenever nodes/edges change
  React.useEffect(() => {
    const validation = TreeValidator.validateTree(
      reactFlowNodes,
      reactFlowEdges
    );
    setValidationErrors(validation.errors);
  }, [reactFlowNodes, reactFlowEdges]);

  // Handle node drag end
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeMove(node.id, node.position);
    },
    [onNodeMove]
  );

  // Handle new connections with improved validation for conditional branching
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const errors: string[] = [];
      const sourceNode = reactFlowNodes.find((n) => n.id === params.source);
      const targetNode = reactFlowNodes.find((n) => n.id === params.target);

      // Check if target already has a parent
      const targetHasParent = TreeValidator.hasParent(
        reactFlowEdges,
        params.target
      );

      if (targetHasParent) {
        // Special exception: Allow conditional nodes to connect to nodes that already have parents
        // This enables branching - one node can be reached through different conditional paths
        const isFromConditionalNode =
          sourceNode?.type === "ConditionNode" &&
          (params.sourceHandle === "true" || params.sourceHandle === "false");

        if (!isFromConditionalNode) {
          errors.push(
            `Cannot connect: Node ${
              targetNode?.data?.label || params.target.slice(-8)
            } already has a parent. Use conditional branching instead.`
          );
        }
      }

      // Check if this would create a cycle
      if (
        TreeValidator.wouldCreateCycle(
          reactFlowEdges,
          params.source,
          params.target
        )
      ) {
        errors.push(`Cannot connect: This connection would create a cycle.`);
      }

      // Check for self-connection
      if (params.source === params.target) {
        errors.push("Cannot connect: Node cannot connect to itself.");
      }

      // For conditional nodes, validate that we're not connecting the same branch twice
      if (sourceNode?.type === "ConditionNode" && params.sourceHandle) {
        const existingConnectionsFromSameHandle = reactFlowEdges.filter(
          (edge) =>
            edge.source === params.source &&
            edge.sourceHandle === params.sourceHandle
        );

        if (existingConnectionsFromSameHandle.length > 0) {
          const branchName = params.sourceHandle === "true" ? "Yes" : "No";
          errors.push(
            `Cannot connect: The ${branchName} branch of this conditional already has a connection.`
          );
        }
      }

      if (errors.length > 0) {
        alert(`Connection Invalid:\n\n${errors.join("\n\n")}`);
        setValidationErrors(errors);
        return;
      }

      // Connection is valid, add it
      const success = onEdgeAdd(
        params.source,
        params.sourceHandle || "out",
        params.target,
        params.targetHandle || "in"
      );

      if (!success) {
        alert("Failed to create connection");
      }

      setValidationErrors([]);
    },
    [reactFlowEdges, reactFlowNodes, onEdgeAdd]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  // Handle edge deletion
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      onEdgeDelete(edge.id);
    },
    [onEdgeDelete]
  );

  // Handle canvas click (deselect nodes)
  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Handle drag over for native HTML5 drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop for native HTML5 drag and drop with Start node validation
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowInstance || !reactFlowBounds) return;

      try {
        const data = event.dataTransfer.getData("application/json");
        const { nodeType } = JSON.parse(data);

        if (nodeType) {
          // Check if trying to add a Start node when one already exists
          if (nodeType === "StartNode") {
            const existingStartNodes = workflowNodes.filter(
              (node) => node.type === "StartNode"
            );
            if (existingStartNodes.length > 0) {
              alert(
                "Only one Start node is allowed per workflow. Please remove the existing Start node first."
              );
              return;
            }
          }

          const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          });

          onNodeAdd(nodeType, position);
        }
      } catch (error) {
        console.error("Error parsing drop data:", error);
      }
    },
    [reactFlowInstance, onNodeAdd, workflowNodes]
  );

  // Get tree statistics
  const treeStats = useMemo(() => {
    const roots = TreeValidator.findRootNodes(reactFlowNodes, reactFlowEdges);
    const treeStructure = TreeValidator.buildTreeStructure(
      reactFlowNodes,
      reactFlowEdges
    );

    return {
      rootCount: roots.length,
      totalDepth: Math.max(
        ...treeStructure.jobs.map((tree: any) => getTreeDepth(tree)),
        0
      ),
      isValidTree: validationErrors.length === 0,
    };
  }, [reactFlowNodes, reactFlowEdges, validationErrors]);

  // Helper function to calculate tree depth
  function getTreeDepth(node: any): number {
    if (!node.subnodes || node.subnodes.length === 0) return 1;
    return (
      1 + Math.max(...node.subnodes.map((child: any) => getTreeDepth(child)))
    );
  }

  // Default edge options for smoother connections
  const defaultEdgeOptions = {
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "#6b7280",
      strokeWidth: 2,
    },
  };

  return (
    <div
      className="h-full w-full relative"
      ref={reactFlowWrapper}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        connectOnClick={false}
        deleteKeyCode={["Delete", "Backspace"]}
        connectionLineStyle={{
          stroke: "#6b7280",
          strokeWidth: 2,
          strokeDasharray: "5,5",
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
        className="bg-gray-50"
        proOptions={{ hideAttribution: true }}
      >
        {/* Background pattern */}
        <Background variant={"dots" as any} gap={20} size={1} color="#e5e7eb" />

        {/* Controls */}
        <Controls
          position="bottom-right"
          className="bg-white shadow-lg border border-gray-200 rounded-lg"
        />

        {/* Mini map */}
        <MiniMap
          position="bottom-left"
          className="bg-white border border-gray-200 rounded-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case "StartNode":
                return "#3b82f6";
              case "AddTaskNode":
                return "#10b981";
              case "ConditionNode":
                return "#f97316";
              default:
                return "#6b7280";
            }
          }}
        />

        {/* Tree Statistics Panel */}
        <Panel
          position="top-left"
          className="bg-white p-3 rounded-lg shadow-lg border border-gray-200"
        >
          <div className="text-sm">
            <div className="font-semibold text-gray-900 mb-2">
              Tree Structure
            </div>
            <div className="space-y-1 text-gray-600">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    treeStats.isValidTree ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>
                  {treeStats.isValidTree ? "Valid Tree" : "Invalid Structure"}
                </span>
              </div>
              <div>Roots: {treeStats.rootCount}</div>
              <div>Nodes: {nodes.length}</div>
              <div>Max Depth: {treeStats.totalDepth}</div>
              <div>Connections: {edges.length}</div>
            </div>
          </div>
        </Panel>

        {/* Validation Errors Panel */}
        {validationErrors.length > 0 && (
          <Panel position="top-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <h3 className="font-semibold text-yellow-900">
                  Workflow Structure Info
                </h3>
              </div>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-yellow-700">
                    • {error}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <Panel position={"top-center" as any}>
            <div className="text-center text-gray-500 bg-white p-6 rounded-lg shadow-lg border border-gray-200 max-w-md">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <h3 className="text-lg font-medium mb-2 text-gray-900">
                Start Building Your Workflow Tree
              </h3>
              <p className="text-sm">
                Drag nodes from the left panel to create a hierarchical
                workflow. Connect nodes to form a tree structure with one root
                and branching paths.
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
