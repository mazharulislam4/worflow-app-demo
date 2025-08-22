/**
 * Main workflow state management hook
 * Provides optimized state operations with performance improvements
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { getNodeConfig } from "../nodeConfigs";
import {
  AddNodeContext,
  NodeType,
  Position,
  ValidationResult,
  WorkflowEdge,
  WorkflowNode,
} from "../types";
import { WorkflowUtils } from "../workflowUtils";

interface UseWorkflowReturn {
  // State
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  validation: ValidationResult;
  isDragging: boolean;

  // Node operations
  addNode: (type: NodeType, position: Position) => string;
  addNodeWithContext: (type: NodeType, context: AddNodeContext) => string;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode["data"]>) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, position: Position) => void;
  selectNode: (nodeId: string | null) => void;
  duplicateNode: (nodeId: string) => string | null;

  // Edge operations
  addEdge: (
    fromNodeId: string,
    outputHandle: string,
    toNodeId: string,
    inputHandle: string
  ) => boolean;
  deleteEdge: (edgeId: string) => void;
  canConnect: (
    fromNodeId: string,
    outputHandle: string,
    toNodeId: string,
    inputHandle: string
  ) => boolean;

  // Workflow operations
  clearWorkflow: () => void;
  validateWorkflow: () => ValidationResult;
  exportUIConfig: () => string;
  exportJobsConfig: () => string;
  importWorkflow: (config: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }) => void;

  // Utility functions
  getNodeById: (nodeId: string) => WorkflowNode | undefined;
  getNodesNeedingConnections: () => {
    nodeId: string;
    missingHandles: string[];
  }[];
  setDragging: (dragging: boolean) => void;
}

export const useWorkflow = (): UseWorkflowReturn => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Use refs for performance optimization during drag operations
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Update refs when state changes
  useMemo(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Validation is computed on every state change
  const validation = useMemo(() => {
    return WorkflowUtils.validateWorkflow(nodes, edges);
  }, [nodes, edges]);

  // === NODE OPERATIONS ===

  const addNode = useCallback((type: NodeType, position: Position): string => {
    const newNode = WorkflowUtils.createNode(type, position);
    setNodes((prev) => [...prev, newNode]);
    return newNode.id;
  }, []);

  const addNodeWithContext = useCallback(
    (type: NodeType, context: AddNodeContext): string => {
      const { position, afterNodeId, direction } = context;
      const newNode = WorkflowUtils.createNode(type, position);

      setNodes((prev) => [...prev, newNode]);

      // Auto-connect if context specifies
      if (afterNodeId && direction) {
        const sourceNode = nodesRef.current.find((n) => n.id === afterNodeId);
        if (sourceNode) {
          const sourceConfig = getNodeConfig(sourceNode.type);
          const targetConfig = getNodeConfig(type);

          // Find compatible handles for auto-connection
          const sourceOutput = sourceConfig.handles.find(
            (h) => h.type === "output"
          );
          const targetInput = targetConfig.handles.find(
            (h) => h.type === "input"
          );

          if (sourceOutput && targetInput) {
            // For condition nodes, choose the right output based on direction
            let outputHandle = sourceOutput.id;
            if (sourceNode.type === "ConditionNode") {
              outputHandle =
                direction === "top"
                  ? "true"
                  : direction === "bottom"
                  ? "false"
                  : sourceOutput.id;
            }

            setTimeout(() => {
              setEdges((prev) => {
                const newEdge = WorkflowUtils.createEdge(
                  afterNodeId,
                  outputHandle,
                  newNode.id,
                  targetInput.id
                );
                return [...prev, newEdge];
              });
            }, 0);
          }
        }
      }

      return newNode.id;
    },
    []
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<WorkflowNode["data"]>) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    []
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== nodeId));
      setEdges((prev) =>
        prev.filter((edge) => edge.from !== nodeId && edge.to !== nodeId)
      );

      // Clear selection if deleted node was selected
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId]
  );

  const moveNode = useCallback((nodeId: string, position: Position) => {
    // Optimized for smooth dragging - batch updates
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, position } : node))
    );
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const duplicateNode = useCallback(
    (nodeId: string): string | null => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return null;

      const newPosition = {
        x: node.position.x + 50,
        y: node.position.y + 50,
      };

      const newNode = WorkflowUtils.createNode(
        node.type,
        newPosition,
        node.data.config
      );
      newNode.data.label = `${node.data.label} (Copy)`;

      setNodes((prev) => [...prev, newNode]);
      return newNode.id;
    },
    [nodes]
  );

  // === EDGE OPERATIONS ===

  const canConnect = useCallback(
    (
      fromNodeId: string,
      outputHandle: string,
      toNodeId: string,
      inputHandle: string
    ): boolean => {
      const sourceNode = nodesRef.current.find((n) => n.id === fromNodeId);
      const targetNode = nodesRef.current.find((n) => n.id === toNodeId);

      if (!sourceNode || !targetNode) return false;

      const validation = WorkflowUtils.validateConnection(
        sourceNode,
        outputHandle,
        targetNode,
        inputHandle,
        edgesRef.current
      );

      return validation.canConnect;
    },
    []
  );

  const addEdge = useCallback(
    (
      fromNodeId: string,
      outputHandle: string,
      toNodeId: string,
      inputHandle: string
    ): boolean => {
      const sourceNode = nodesRef.current.find((n) => n.id === fromNodeId);
      const targetNode = nodesRef.current.find((n) => n.id === toNodeId);

      if (!sourceNode || !targetNode) return false;

      const validation = WorkflowUtils.validateConnection(
        sourceNode,
        outputHandle,
        targetNode,
        inputHandle,
        edgesRef.current
      );

      if (!validation.canConnect) {
        console.warn("Connection rejected:", validation.reason);
        return false;
      }

      const newEdge = WorkflowUtils.createEdge(
        fromNodeId,
        outputHandle,
        toNodeId,
        inputHandle
      );
      setEdges((prev) => [...prev, newEdge]);
      return true;
    },
    []
  );

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  }, []);

  // === WORKFLOW OPERATIONS ===

  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setIsDragging(false);
  }, []);

  const validateWorkflow = useCallback(() => {
    return WorkflowUtils.validateWorkflow(nodes, edges);
  }, [nodes, edges]);

  const exportUIConfig = useCallback(() => {
    const config = WorkflowUtils.exportUIConfig(nodes, edges);
    return JSON.stringify(config, null, 2);
  }, [nodes, edges]);

  const exportJobsConfig = useCallback(() => {
    const config = WorkflowUtils.exportJobsConfig(nodes, edges);
    return JSON.stringify(config, null, 2);
  }, [nodes, edges]);

  const importWorkflow = useCallback(
    (config: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => {
      setNodes(config.nodes);
      setEdges(config.edges);
      setSelectedNodeId(null);
    },
    []
  );

  // === UTILITY FUNCTIONS ===

  const getNodeById = useCallback(
    (nodeId: string) => {
      return nodes.find((node) => node.id === nodeId);
    },
    [nodes]
  );

  const getNodesNeedingConnections = useCallback(() => {
    return WorkflowUtils.findNodesNeedingConnections(nodes, edges);
  }, [nodes, edges]);

  const setDragging = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  return {
    // State
    nodes,
    edges,
    selectedNodeId,
    validation,
    isDragging,

    // Node operations
    addNode,
    addNodeWithContext,
    updateNode,
    deleteNode,
    moveNode,
    selectNode,
    duplicateNode,

    // Edge operations
    addEdge,
    deleteEdge,
    canConnect,

    // Workflow operations
    clearWorkflow,
    validateWorkflow,
    exportUIConfig,
    exportJobsConfig,
    importWorkflow,

    // Utility functions
    getNodeById,
    getNodesNeedingConnections,
    setDragging,
  };
};
