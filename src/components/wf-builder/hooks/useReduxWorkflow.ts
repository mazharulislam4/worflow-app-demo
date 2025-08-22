import {
  addEdge,
  addNode,
  clearWorkflow,
  deleteEdge,
  deleteNode,
  selectEdges,
  selectNode,
  selectNodes,
  selectSelectedNode,
  updateNode,
  updateNodePosition,
} from "@/redux/features/workflowSlice";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NodeType, Position } from "../types";

export const useReduxWorkflow = () => {
  const dispatch = useDispatch();

  // Selectors
  const nodes = useSelector(selectNodes);
  const edges = useSelector(selectEdges);
  const selectedNode = useSelector(selectSelectedNode);

  // Simple validation based on nodes and edges
  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation - check if workflow has nodes
    if (!nodes || nodes.length === 0) {
      warnings.push("Workflow is empty. Add some nodes to get started.");
    }

    // Check for disconnected nodes (except start nodes)
    if (nodes && edges) {
      const connectedNodeIds = new Set<string>();
      edges.forEach((edge: any) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const disconnectedNodes = nodes.filter(
        (node: any) =>
          !connectedNodeIds.has(node.id) && node.type !== "StartNode"
      );

      if (disconnectedNodes.length > 0) {
        warnings.push(
          `${disconnectedNodes.length} node(s) are not connected to the workflow.`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [nodes, edges]);

  // Node operations
  const addWorkflowNode = useCallback(
    (type: NodeType, position: Position) => {
      const nodeId = `${type}-${Date.now()}`;
      dispatch(
        addNode({
          nodeType: type as any, // Cast to match the slice's JobType
          position,
        })
      );
      return nodeId;
    },
    [dispatch]
  );

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<any>) => {
      dispatch(updateNode({ id: nodeId, updates: data }));
    },
    [dispatch]
  );

  const moveNodePosition = useCallback(
    (nodeId: string, position: Position) => {
      dispatch(updateNodePosition({ id: nodeId, position }));
    },
    [dispatch]
  );

  const deleteNodeById = useCallback(
    (nodeId: string) => {
      dispatch(deleteNode(nodeId));
    },
    [dispatch]
  );

  const selectWorkflowNode = useCallback(
    (nodeId: string | null) => {
      dispatch(selectNode(nodeId));
    },
    [dispatch]
  );

  // Edge operations
  const addWorkflowEdge = useCallback(
    (edge: {
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }) => {
      dispatch(
        addEdge({
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })
      );
    },
    [dispatch]
  );

  const deleteWorkflowEdge = useCallback(
    (edgeId: string) => {
      dispatch(deleteEdge(edgeId));
    },
    [dispatch]
  );

  // Workflow operations
  const clearWorkflowData = useCallback(() => {
    dispatch(clearWorkflow());
  }, [dispatch]);

  // Export functions
  const exportJobsConfig = useCallback(() => {
    // Simple export function - convert nodes and edges to JSON
    const config = {
      nodes: nodes || [],
      edges: edges || [],
    };
    return JSON.stringify(config, null, 2);
  }, [nodes, edges]);

  return {
    // State
    nodes,
    edges,
    selectedNode,
    validation,

    // Node operations
    addNode: addWorkflowNode,
    updateNode: updateNodeData,
    updateNodePosition: moveNodePosition,
    deleteNode: deleteNodeById,
    selectNode: selectWorkflowNode,

    // Edge operations
    addEdge: addWorkflowEdge,
    deleteEdge: deleteWorkflowEdge,

    // Workflow operations
    clearWorkflow: clearWorkflowData,

    // Export functions
    exportJobsConfig,
  };
};
