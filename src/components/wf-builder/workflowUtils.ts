/**
 * Core workflow utilities - business logic for DAG operations
 */

import {
  createNodeHandles,
  getNodeConfig,
  getNodeDefaultConfig,
} from "./nodeConfigs";
import {
  BackendJobsConfig,
  ConnectionValidation,
  NodeType,
  Position,
  UIWorkflowConfig,
  ValidationResult,
  WorkflowEdge,
  WorkflowNode,
} from "./types";

export class WorkflowUtils {
  /**
   * Generate unique ID for nodes and edges
   */
  static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new workflow node with proper configuration
   */
  static createNode(
    type: NodeType,
    position: Position,
    customData?: Record<string, any>
  ): WorkflowNode {
    const config = getNodeConfig(type);
    const id = this.generateId();

    return {
      id,
      type,
      position,
      data: {
        label: config.label,
        config: {
          ...getNodeDefaultConfig(type),
          ...customData,
        },
      },
      handles: createNodeHandles(type),
    };
  }

  /**
   * Create a new workflow edge
   */
  static createEdge(
    fromNodeId: string,
    outputHandle: string,
    toNodeId: string,
    inputHandle: string
  ): WorkflowEdge {
    return {
      id: this.generateId(),
      from: fromNodeId,
      output: outputHandle,
      to: toNodeId,
      input: inputHandle,
    };
  }

  /**
   * Validate if a connection between two nodes is allowed
   */
  static validateConnection(
    sourceNode: WorkflowNode,
    sourceHandle: string,
    targetNode: WorkflowNode,
    targetHandle: string,
    existingEdges: WorkflowEdge[]
  ): ConnectionValidation {
    // Check if handles exist
    const sourceHandleExists = sourceNode.handles.find(
      (h) => h.id === sourceHandle && h.type === "output"
    );
    const targetHandleExists = targetNode.handles.find(
      (h) => h.id === targetHandle && h.type === "input"
    );

    if (!sourceHandleExists) {
      return { canConnect: false, reason: "Source handle does not exist" };
    }

    if (!targetHandleExists) {
      return { canConnect: false, reason: "Target handle does not exist" };
    }

    // Prevent self-connection
    if (sourceNode.id === targetNode.id) {
      return { canConnect: false, reason: "Cannot connect node to itself" };
    }

    // Check if target input is already connected (only one input per handle)
    const existingConnection = existingEdges.find(
      (edge) => edge.to === targetNode.id && edge.input === targetHandle
    );

    if (existingConnection) {
      return { canConnect: false, reason: "Target input is already connected" };
    }

    // Prevent cycles (DAG enforcement)
    if (this.wouldCreateCycle(sourceNode.id, targetNode.id, existingEdges)) {
      return {
        canConnect: false,
        reason: "Connection would create a cycle (DAG violation)",
      };
    }

    return { canConnect: true };
  }

  /**
   * Check if adding an edge would create a cycle using DFS
   */
  private static wouldCreateCycle(
    fromNodeId: string,
    toNodeId: string,
    existingEdges: WorkflowEdge[]
  ): boolean {
    // Build adjacency list
    const graph = new Map<string, Set<string>>();

    // Add existing edges
    for (const edge of existingEdges) {
      if (!graph.has(edge.from)) {
        graph.set(edge.from, new Set());
      }
      graph.get(edge.from)!.add(edge.to);
    }

    // Add the proposed edge temporarily
    if (!graph.has(fromNodeId)) {
      graph.set(fromNodeId, new Set());
    }
    graph.get(fromNodeId)!.add(toNodeId);

    // Check for cycle using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // Back edge found - cycle detected
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Check all nodes for cycles
    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Comprehensive workflow validation
   */
  static validateWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for at least one start node
    const startNodes = nodes.filter((node) => node.type === "StartNode");
    if (startNodes.length === 0) {
      errors.push("Workflow must have at least one Start node");
    }

    // Check for isolated nodes
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.from);
      connectedNodeIds.add(edge.to);
    });

    const isolatedNodes = nodes.filter(
      (node) => node.type !== "StartNode" && !connectedNodeIds.has(node.id)
    );

    if (isolatedNodes.length > 0) {
      warnings.push(`${isolatedNodes.length} isolated node(s) found`);
    }

    // Check for missing required connections
    for (const node of nodes) {
      const requiredInputs = node.handles.filter(
        (h) => h.type === "input" && h.required
      );

      for (const requiredInput of requiredInputs) {
        const hasConnection = edges.some(
          (edge) => edge.to === node.id && edge.input === requiredInput.id
        );

        if (!hasConnection) {
          errors.push(
            `Node "${node.data.label}" is missing required input connection`
          );
        }
      }
    }

    // Check for unreachable nodes from start nodes
    if (startNodes.length > 0) {
      const reachableNodes = this.getReachableNodes(startNodes, edges);
      const unreachableNodes = nodes.filter(
        (node) => node.type !== "StartNode" && !reachableNodes.has(node.id)
      );

      if (unreachableNodes.length > 0) {
        warnings.push(`${unreachableNodes.length} unreachable node(s) found`);
      }
    }

    // Check for dangling outputs (outputs that don't connect to anything)
    const danglingOutputs = nodes.filter((node) => {
      const outputs = node.handles.filter((h) => h.type === "output");
      return outputs.some((output) => {
        return !edges.some(
          (edge) => edge.from === node.id && edge.output === output.id
        );
      });
    });

    if (danglingOutputs.length > 0) {
      warnings.push(
        `${danglingOutputs.length} node(s) have unconnected outputs`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get all nodes reachable from start nodes using BFS
   */
  private static getReachableNodes(
    startNodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Set<string> {
    const reachable = new Set<string>();
    const queue = [...startNodes.map((n) => n.id)];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (reachable.has(currentId)) continue;

      reachable.add(currentId);

      // Find all nodes this one connects to
      const outgoingEdges = edges.filter((edge) => edge.from === currentId);
      for (const edge of outgoingEdges) {
        if (!reachable.has(edge.to)) {
          queue.push(edge.to);
        }
      }
    }

    return reachable;
  }

  /**
   * Get topological order of nodes for execution (Kahn's algorithm)
   */
  static getTopologicalOrder(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): string[] {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // Initialize
    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      graph.set(node.id, []);
    });

    // Build graph and calculate in-degrees
    edges.forEach((edge) => {
      graph.get(edge.from)!.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    });

    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    // Start with nodes that have no incoming edges
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Remove edges from current node
      const neighbors = graph.get(current) || [];
      neighbors.forEach((neighbor) => {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  }

  /**
   * Export workflow in UI format (preserves all UI state)
   */
  static exportUIConfig(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): UIWorkflowConfig {
    return {
      nodes: nodes.map((node) => ({
        ...node,
        handles: [...node.handles], // Deep copy handles
      })),
      edges: [...edges],
    };
  }

  /**
   * Export workflow in backend jobs format (execution ready)
   */
  static exportJobsConfig(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): BackendJobsConfig {
    const jobs = nodes.map((node) => {
      // Map node types to backend job types (remove 'Node' suffix)
      const typeMapping: Record<NodeType, string> = {
        StartNode: "Start",
        AddTaskNode: "AddTask",
        ConditionNode: "Condition",
        APICallNode: "APICall",
        ScriptNode: "Script",
        SendEmailNode: "SendEmail",
        EndNode: "End",
      };

      // Find all outgoing connections from this node
      const connections = edges
        .filter((edge) => edge.from === node.id)
        .map((edge) => ({
          targetJobId: edge.to,
          condition: edge.output || "default", // For conditional nodes, this will be "true" or "false"
        }));

      // Find incoming connections to this node (for dependency tracking)
      const dependencies = edges
        .filter((edge) => edge.to === node.id)
        .map((edge) => ({
          sourceJobId: edge.from,
          condition: edge.output || "default",
        }));

      const jobConfig = {
        type: typeMapping[node.type],
        attributes: {
          nodeId: node.id,
          label: node.data.label,
          ...node.data.config,
        },
        connections: connections.length > 0 ? connections : [],
        dependencies: dependencies.length > 0 ? dependencies : [],
        // Add conditional flag for easy identification
        isConditional: node.type === "ConditionNode",
      };

      return jobConfig;
    });

    // Also include the execution flow for better backend understanding
    const executionFlow = {
      startNode: nodes.find((node) => node.type === "StartNode")?.id || null,
      totalJobs: jobs.length,
      hasConditionalFlow: jobs.some((job) => job.isConditional),
    };

    return {
      jobs,
      executionFlow,
    };
  }

  /**
   * Find nodes that need connections for highlighting
   */
  static findNodesNeedingConnections(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): { nodeId: string; missingHandles: string[] }[] {
    const result: { nodeId: string; missingHandles: string[] }[] = [];

    for (const node of nodes) {
      const missingHandles: string[] = [];

      // Check required input handles
      const requiredInputs = node.handles.filter(
        (h) => h.type === "input" && h.required
      );

      for (const handle of requiredInputs) {
        const hasConnection = edges.some(
          (edge) => edge.to === node.id && edge.input === handle.id
        );

        if (!hasConnection) {
          missingHandles.push(handle.id);
        }
      }

      if (missingHandles.length > 0) {
        result.push({ nodeId: node.id, missingHandles });
      }
    }

    return result;
  }

  /**
   * Calculate optimal position for a new node based on direction
   */
  static calculateNewNodePosition(
    sourceNode: WorkflowNode,
    direction: "top" | "bottom" | "left" | "right",
    offset: number = 200
  ): Position {
    const { x, y } = sourceNode.position;

    switch (direction) {
      case "right":
        return { x: x + offset, y };
      case "left":
        return { x: x - offset, y };
      case "top":
        return { x, y: y - offset };
      case "bottom":
        return { x, y: y + offset };
      default:
        return { x: x + offset, y };
    }
  }

  /**
   * Find compatible connection points between two nodes
   */
  static findCompatibleConnections(
    sourceNode: WorkflowNode,
    targetNode: WorkflowNode,
    edges: WorkflowEdge[]
  ): { sourceHandle: string; targetHandle: string }[] {
    const connections: { sourceHandle: string; targetHandle: string }[] = [];

    const sourceOutputs = sourceNode.handles.filter((h) => h.type === "output");
    const targetInputs = targetNode.handles.filter((h) => h.type === "input");

    for (const sourceHandle of sourceOutputs) {
      for (const targetHandle of targetInputs) {
        const validation = this.validateConnection(
          sourceNode,
          sourceHandle.id,
          targetNode,
          targetHandle.id,
          edges
        );

        if (validation.canConnect) {
          connections.push({
            sourceHandle: sourceHandle.id,
            targetHandle: targetHandle.id,
          });
        }
      }
    }

    return connections;
  }

  /**
   * Clone a workflow (useful for templates or versioning)
   */
  static cloneWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    positionOffset: Position = { x: 50, y: 50 }
  ): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
    const nodeIdMap = new Map<string, string>();

    // Clone nodes with new IDs and offset positions
    const clonedNodes = nodes.map((node) => {
      const newId = this.generateId();
      nodeIdMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + positionOffset.x,
          y: node.position.y + positionOffset.y,
        },
        data: {
          ...node.data,
          config: { ...node.data.config },
        },
        handles: [...node.handles],
      };
    });

    // Clone edges with updated node IDs
    const clonedEdges = edges.map((edge) => ({
      ...edge,
      id: this.generateId(),
      from: nodeIdMap.get(edge.from)!,
      to: nodeIdMap.get(edge.to)!,
    }));

    return { nodes: clonedNodes, edges: clonedEdges };
  }
}
