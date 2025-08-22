import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type JobType =
  | "StartNode"
  | "AddTaskNode"
  | "ConditionNode"
  | "APICallNode"
  | "ScriptNode"
  | "SendEmailNode";

/**
 * Represents a workflow node in tree structure
 */
export interface WorkflowNode {
  id: string;
  type: JobType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
  };
  measured?: {
    width?: number;
    height?: number;
  };
}

/**
 * Represents a parent-child relationship in the tree
 */
export interface WorkflowEdge {
  id: string;
  source: string; // parent node
  target: string; // child node
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

/**
 * Tree node structure for hierarchical representation
 */
export interface TreeNode {
  id: string;
  type: JobType;
  attributes: Record<string, any>;
  subnodes: TreeNode[];
}

export interface NodeType {
  id: string;
  label: string;
  icon?: string;
  category: string;
  defaultConfig: Record<string, any>;
  schema: Record<string, any>;
}

export interface WorkflowState {
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  nodeTypes: NodeType[];
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  canvasViewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Default node types with their configurations
const defaultNodeTypes: NodeType[] = [
  {
    id: "StartNode",
    label: "Start Node",
    category: "Control",
    icon: "�",
    defaultConfig: {
      noteId: "",
      content: "",
      createdBy: "",
      timestamp: "",
      visibility: "internal",
    },
    schema: {
      type: "object",
      properties: {
        noteId: { type: "string", title: "Note ID" },
        content: {
          type: "string",
          title: "Note Content",
          required: true,
          multiline: true,
        },
        createdBy: { type: "string", title: "Created By", required: true },
        timestamp: { type: "string", title: "Timestamp", format: "date-time" },
        visibility: {
          type: "string",
          title: "Visibility",
          enum: ["internal", "external", "public"],
          default: "internal",
        },
      },
      required: ["content", "createdBy"],
    },
  },
  {
    id: "AddTaskNode",
    label: "Add Task",
    category: "Communication",
    icon: "📧",
    defaultConfig: {
      emailId: "",
      to: [],
      cc: [],
      subject: "",
      body: "",
      emailTemplateId: "",
      sentBy: "",
      timestamp: "",
      status: "draft",
    },
    schema: {
      type: "object",
      properties: {
        emailId: { type: "string", title: "Email ID" },
        to: {
          type: "array",
          title: "To",
          items: { type: "string", format: "email" },
          required: true,
        },
        cc: {
          type: "array",
          title: "CC",
          items: { type: "string", format: "email" },
        },
        subject: { type: "string", title: "Subject", required: true },
        body: {
          type: "string",
          title: "Email Body",
          required: true,
          multiline: true,
        },
        emailTemplateId: { type: "string", title: "Email Template ID" },
        sentBy: { type: "string", title: "Sent By", required: true },
        timestamp: { type: "string", title: "Timestamp", format: "date-time" },
        status: {
          type: "string",
          title: "Status",
          enum: ["draft", "sent", "failed"],
          default: "draft",
        },
      },
      required: ["to", "subject", "body", "sentBy"],
    },
  },
  {
    id: "AddTaskNode",
    label: "Add Task",
    category: "Task Management",
    icon: "✓",
    defaultConfig: {
      taskId: "",
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      assignedTo: "",
      dueDate: "",
      taskTypeId: "",
    },
    schema: {
      type: "object",
      properties: {
        taskId: { type: "string", title: "Task ID" },
        title: { type: "string", title: "Task Title", required: true },
        description: { type: "string", title: "Description", multiline: true },
        status: {
          type: "string",
          title: "Status",
          enum: ["pending", "in-progress", "completed", "cancelled"],
          default: "pending",
        },
        priority: {
          type: "string",
          title: "Priority",
          enum: ["low", "medium", "high", "urgent"],
          default: "medium",
        },
        assignedTo: { type: "string", title: "Assigned To", required: true },
        dueDate: { type: "string", title: "Due Date", format: "date" },
        taskTypeId: { type: "string", title: "Task Type ID" },
      },
      required: ["title", "assignedTo"],
    },
  },
  {
    id: "Conditional",
    label: "Conditional",
    category: "Logic",
    icon: "🔀",
    defaultConfig: {
      condition: "",
      field: "",
      operator: "equals",
      value: "",
      trueLabel: "True",
      falseLabel: "False",
    },
    schema: {
      type: "object",
      properties: {
        condition: {
          type: "string",
          title: "Condition Description",
          description: "Describe what this condition checks",
          required: true,
        },
        field: {
          type: "string",
          title: "Field to Check",
          description: "The field, variable, or property to evaluate",
          required: true,
        },
        operator: {
          type: "string",
          title: "Operator",
          enum: [
            "equals",
            "not_equals",
            "greater_than",
            "less_than",
            "contains",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "exists",
            "not_exists",
          ],
          enumNames: [
            "Equals",
            "Not Equals",
            "Greater Than",
            "Less Than",
            "Contains",
            "Starts With",
            "Ends With",
            "Is Empty",
            "Is Not Empty",
            "Exists",
            "Does Not Exist",
          ],
          default: "equals",
        },
        value: {
          type: "string",
          title: "Value to Compare",
          description:
            "The value to compare against (leave empty for existence checks)",
        },
        trueLabel: {
          type: "string",
          title: "True Branch Label",
          description: "Label for the path when condition is true",
          default: "True",
        },
        falseLabel: {
          type: "string",
          title: "False Branch Label",
          description: "Label for the path when condition is false",
          default: "False",
        },
      },
      required: ["condition", "field", "operator"],
    },
  },
];




const initialState: WorkflowState = {
  workflowName: "Untitled Workflow Tree",
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  nodeTypes: defaultNodeTypes,
  isLeftPanelCollapsed: false,
  isRightPanelCollapsed: false,
  canvasViewport: { x: 0, y: 0, zoom: 1 },
};

/**
 * Tree utility functions
 */
class TreeUtils {
  /**
   * Build hierarchical tree structure from flat nodes and edges
   * Returns structure: { jobs: [siblings], subnodes: [children] }
   */
  static buildTreeStructure(nodes: WorkflowNode[], edges: WorkflowEdge[]): any {
    if (nodes.length === 0) {
      return { jobs: [] };
    }

    // Create a map of node ID to node data
    const nodeMap = new Map<string, any>();

    // Initialize all nodes with empty jobs and subnodes arrays
    nodes.forEach((node) => {
      nodeMap.set(node.id, {
        id: node.id,
        type: node.type,
        attributes: node.data.config,
        jobs: [],
        subnodes: [],
      });
    });

    // Find all nodes that have parents (are targets of edges)
    const nodesWithParents = new Set(edges.map((edge) => edge.target));

    // Build parent-child relationships
    edges.forEach((edge) => {
      const parent = nodeMap.get(edge.source);
      const child = nodeMap.get(edge.target);

      if (parent && child) {
        // Children go into subnodes array
        parent.subnodes.push(child);
      }
    });

    // Find root nodes (nodes without parents)
    const rootNodes = nodes
      .filter((node) => !nodesWithParents.has(node.id))
      .map((node) => nodeMap.get(node.id)!)
      .filter(Boolean);

    // Return the root structure with jobs array
    return {
      jobs: rootNodes,
    };
  }

  /**
   * Validate tree structure
   */
  static validateTreeStructure(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (nodes.length === 0) {
      return { isValid: true, errors: [] };
    }

    // Check for multiple parents
    const targetCounts = new Map<string, number>();
    edges.forEach((edge) => {
      targetCounts.set(edge.target, (targetCounts.get(edge.target) || 0) + 1);
    });

    for (const [nodeId, count] of targetCounts.entries()) {
      if (count > 1) {
        const node = nodes.find((n) => n.id === nodeId);
        errors.push(
          `Node "${
            node?.data.label || nodeId
          }" has multiple parents. Tree structure allows only one parent per node.`
        );
      }
    }

    // Find root nodes
    const nodesWithParents = new Set(edges.map((edge) => edge.target));
    const rootNodes = nodes.filter((node) => !nodesWithParents.has(node.id));

    if (rootNodes.length === 0 && nodes.length > 0) {
      errors.push(
        "No root node found. Tree must have at least one node without a parent."
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    // === WORKFLOW METADATA ===
    setWorkflowName: (state, action: PayloadAction<string>) => {
      state.workflowName = action.payload;
    },

    // === NODE OPERATIONS ===
    addNode: (
      state,
      action: PayloadAction<{
        nodeType: JobType;
        position: { x: number; y: number };
      }>
    ) => {
      const { nodeType, position } = action.payload;
      const nodeTypeConfig = state.nodeTypes.find((nt) => nt.id === nodeType);

      if (nodeTypeConfig) {
        const newNode: WorkflowNode = {
          id: `${nodeType}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          type: nodeType,
          position,
          data: {
            label: nodeTypeConfig.label,
            config: { ...nodeTypeConfig.defaultConfig },
          },
        };

        // Auto-create VIRTUAL root node if this is the first node
        if (state.nodes.length === 0) {
          const virtualRootNode: WorkflowNode = {
            id: `virtual-root-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            type: "StartNode",
            position: { x: position.x - 350, y: position.y },
            data: {
              label: "START",
              config: {
                isVirtualRoot: true,
                noteId: "virtual-root",
                content: "Workflow Start Point",
                createdBy: "system",
                timestamp: new Date().toISOString(),
                visibility: "internal",
              },
            },
          };

          state.nodes.push(virtualRootNode);

          // Create edge from virtual root to the new node
          const rootEdge: WorkflowEdge = {
            id: `edge-${virtualRootNode.id}-${newNode.id}-${Date.now()}`,
            source: virtualRootNode.id,
            target: newNode.id,
          };
          state.edges.push(rootEdge);
        } else {
          // For subsequent nodes, position them in a sequential flow
          const lastNode = state.nodes[state.nodes.length - 1];
          if (!lastNode.data.config?.isVirtualRoot) {
            // Position new node to the right of the last added node
            newNode.position = {
              x: lastNode.position.x + 300,
              y: lastNode.position.y,
            };
          }
        }

        state.nodes.push(newNode);
      }
    },

    updateNode: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<WorkflowNode> }>
    ) => {
      const { id, updates } = action.payload;
      const nodeIndex = state.nodes.findIndex((node) => node.id === id);
      if (nodeIndex !== -1) {
        state.nodes[nodeIndex] = { ...state.nodes[nodeIndex], ...updates };
      }
    },

    deleteNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      state.nodes = state.nodes.filter((node) => node.id !== nodeId);
      state.edges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      if (state.selectedNodeId === nodeId) {
        state.selectedNodeId = null;
      }
    },

    updateNodePosition: (
      state,
      action: PayloadAction<{ id: string; position: { x: number; y: number } }>
    ) => {
      const { id, position } = action.payload;
      const nodeIndex = state.nodes.findIndex((node) => node.id === id);
      if (nodeIndex !== -1) {
        state.nodes[nodeIndex].position = position;
      }
    },

    updateNodeConfig: (
      state,
      action: PayloadAction<{ id: string; config: Record<string, any> }>
    ) => {
      const { id, config } = action.payload;
      const nodeIndex = state.nodes.findIndex((node) => node.id === id);
      if (nodeIndex !== -1) {
        state.nodes[nodeIndex].data.config = {
          ...state.nodes[nodeIndex].data.config,
          ...config,
        };
      }
    },

    // === EDGE OPERATIONS (Parent-Child Relationships) ===
    addEdge: (state, action: PayloadAction<Omit<WorkflowEdge, "id">>) => {
      const edge = action.payload;
      const newEdge: WorkflowEdge = {
        ...edge,
        id: `edge-${edge.source}-${edge.target}-${Date.now()}`,
      };

      // Prevent duplicate edges
      const existingEdge = state.edges.find(
        (e) => e.source === edge.source && e.target === edge.target
      );

      if (!existingEdge) {
        state.edges.push(newEdge);
      }
    },

    deleteEdge: (state, action: PayloadAction<string>) => {
      const edgeId = action.payload;
      state.edges = state.edges.filter((edge) => edge.id !== edgeId);
      if (state.selectedEdgeId === edgeId) {
        state.selectedEdgeId = null;
      }
    },

    // === SELECTION OPERATIONS ===
    selectNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
      state.selectedEdgeId = null;
    },

    selectEdge: (state, action: PayloadAction<string | null>) => {
      state.selectedEdgeId = action.payload;
      state.selectedNodeId = null;
    },

    // === UI OPERATIONS ===
    toggleLeftPanel: (state) => {
      state.isLeftPanelCollapsed = !state.isLeftPanelCollapsed;
    },

    toggleRightPanel: (state) => {
      state.isRightPanelCollapsed = !state.isRightPanelCollapsed;
    },

    updateCanvasViewport: (
      state,
      action: PayloadAction<{ x: number; y: number; zoom: number }>
    ) => {
      state.canvasViewport = action.payload;
    },

    // === WORKFLOW OPERATIONS ===
    importWorkflow: (
      state,
      action: PayloadAction<{
        name: string;
        nodes: WorkflowNode[];
        edges: WorkflowEdge[];
      }>
    ) => {
      const { name, nodes, edges } = action.payload;
      state.workflowName = name;
      state.nodes = nodes;
      state.edges = edges;
      state.selectedNodeId = null;
      state.selectedEdgeId = null;
    },

    clearWorkflow: (state) => {
      state.workflowName = "Untitled Workflow Tree";
      state.nodes = [];
      state.edges = [];
      state.selectedNodeId = null;
      state.selectedEdgeId = null;
    },
  },
});

// === ACTIONS EXPORT ===
export const {
  setWorkflowName,
  addNode,
  updateNode,
  deleteNode,
  updateNodePosition,
  updateNodeConfig,
  addEdge,
  deleteEdge,
  selectNode,
  selectEdge,
  toggleLeftPanel,
  toggleRightPanel,
  updateCanvasViewport,
  importWorkflow,
  clearWorkflow,
} = workflowSlice.actions;

export default workflowSlice.reducer;

// === SELECTORS ===
export const selectWorkflowState = (state: { workflow: WorkflowState }) =>
  state.workflow;

export const selectNodes = (state: { workflow: WorkflowState }) =>
  state.workflow.nodes;

export const selectEdges = (state: { workflow: WorkflowState }) =>
  state.workflow.edges;

export const selectSelectedNode = (state: { workflow: WorkflowState }) => {
  const selectedId = state.workflow.selectedNodeId;
  return selectedId
    ? state.workflow.nodes.find((node) => node.id === selectedId)
    : null;
};

export const selectSelectedEdge = (state: { workflow: WorkflowState }) => {
  const selectedId = state.workflow.selectedEdgeId;
  return selectedId
    ? state.workflow.edges.find((edge) => edge.id === selectedId)
    : null;
};

export const selectNodeTypes = (state: { workflow: WorkflowState }) =>
  state.workflow.nodeTypes;

/**
 * Generate task execution JSON for backend queue processing
 * Returns sequential jobs array format with conditional branching
 */
export const selectTaskExecutionJSON = (state: { workflow: WorkflowState }) => {
  const { nodes, edges } = state.workflow;

  // Filter out virtual root nodes
  const taskNodes = nodes.filter((node) => !node.data.config?.isVirtualRoot);

  if (taskNodes.length === 0) {
    return { jobs: [] };
  }

  // Build sequential workflow structure
  const buildSequentialJobs = (): any[] => {
    // Find virtual root to start traversal
    const virtualRoot = nodes.find((node) => node.data.config?.isVirtualRoot);

    if (!virtualRoot) {
      // Fallback: return all task nodes as sequential jobs
      return taskNodes.map((node) => ({
        type: node.type,
        attributes: node.data.config,
        jobs: [], // Each job can have nested conditional jobs
      }));
    }

    // Build sequence starting from virtual root
    const visited = new Set<string>();
    const mainSequence: any[] = [];

    const traverseSequential = (nodeId: string): any[] => {
      if (visited.has(nodeId)) return [];
      visited.add(nodeId);

      const currentNode = taskNodes.find((n) => n.id === nodeId);
      if (!currentNode) return [];

      // Find direct children (next in sequence or conditional branches)
      const childEdges = edges.filter((edge) => edge.source === nodeId);

      // Separate main sequence children from conditional branches
      const mainChild = childEdges.find((edge, index) => index === 0); // First child is main sequence
      const conditionalChildren = childEdges.slice(1); // Rest are conditional branches

      // Create job entry
      const jobEntry: any = {
        type: currentNode.type,
        attributes: currentNode.data.config,
      };

      // Add conditional jobs (sub-tasks)
      if (conditionalChildren.length > 0) {
        jobEntry.jobs = conditionalChildren
          .map((edge) => {
            const childNode = taskNodes.find((n) => n.id === edge.target);
            if (childNode) {
              return {
                type: childNode.type,
                attributes: childNode.data.config,
                jobs: [], // Nested conditional jobs can have their own sub-jobs
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      // If no conditional jobs, add empty jobs array
      if (!jobEntry.jobs) {
        jobEntry.jobs = [];
      }

      // Continue with main sequence
      if (mainChild) {
        const nextJobs = traverseSequential(mainChild.target);
        return [jobEntry, ...nextJobs];
      }

      return [jobEntry];
    };

    // Start from virtual root's first child
    const rootChildren = edges.filter((edge) => edge.source === virtualRoot.id);
    if (rootChildren.length > 0) {
      return traverseSequential(rootChildren[0].target);
    }

    return [];
  };

  const jobs = buildSequentialJobs();
  return { jobs };
};

/**
 * Generate the hierarchical tree structure JSON (for UI workflow)
 * Returns the structure: { jobs: [...] } format
 */
export const selectWorkflowTreeJSON = (state: { workflow: WorkflowState }) => {
  const { nodes, edges, workflowName } = state.workflow;

  // Build tree structure
  const treeStructure = TreeUtils.buildTreeStructure(nodes, edges);

  // Validate tree structure
  const validation = TreeUtils.validateTreeStructure(nodes, edges);

  return {
    name: workflowName,
    isValidTree: validation.isValid,
    validationErrors: validation.errors,
    ...treeStructure, // This spreads the { jobs: [...] } structure
    edges: edges, // Keep edges for React Flow
    createdAt: new Date().toISOString(),
  };
};

/**
 * Get flat list of jobs from tree structure (only nodes that are part of the tree)
 */
export const selectWorkflowJobsList = (state: { workflow: WorkflowState }) => {
  const { nodes, edges } = state.workflow;

  // Get all nodes that are connected (part of the tree)
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // If there are no edges but there's exactly one node, it's a root node
  if (edges.length === 0 && nodes.length === 1) {
    connectedNodeIds.add(nodes[0].id);
  }

  // Filter nodes to only include connected ones
  const connectedNodes = nodes.filter((node) => connectedNodeIds.has(node.id));

  return connectedNodes.map((node) => ({
    type: node.type,
    attributes: node.data.config,
  }));
};

/**
 * Get tree statistics and validation info
 */
export const selectTreeStats = (state: { workflow: WorkflowState }) => {
  const { nodes, edges } = state.workflow;

  if (nodes.length === 0) {
    return {
      totalNodes: 0,
      rootNodes: 0,
      totalEdges: 0,
      maxDepth: 0,
      isValidTree: true,
      validationErrors: [],
    };
  }

  const validation = TreeUtils.validateTreeStructure(nodes, edges);
  const treeStructure = TreeUtils.buildTreeStructure(nodes, edges);

  // Calculate max depth recursively
  const calculateDepth = (item: any): number => {
    if (!item.subnodes || item.subnodes.length === 0) return 1;
    return 1 + Math.max(...item.subnodes.map(calculateDepth));
  };

  let maxDepth = 0;
  if (treeStructure.jobs && treeStructure.jobs.length > 0) {
    maxDepth = Math.max(...treeStructure.jobs.map(calculateDepth));
  }

  // Find root nodes
  const nodesWithParents = new Set(edges.map((edge) => edge.target));
  const rootNodes = nodes.filter((node) => !nodesWithParents.has(node.id));

  return {
    totalNodes: nodes.length,
    rootNodes: rootNodes.length,
    totalEdges: edges.length,
    maxDepth,
    isValidTree: validation.isValid,
    validationErrors: validation.errors,
  };
};

/**
 * Get nodes that are not connected (orphaned nodes)
 */
export const selectOrphanedNodes = (state: { workflow: WorkflowState }) => {
  const { nodes, edges } = state.workflow;

  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // If there are no edges but there's exactly one node, it's not orphaned (it's a root)
  if (edges.length === 0 && nodes.length === 1) {
    return [];
  }

  return nodes.filter((node) => !connectedNodeIds.has(node.id));
};

/**
 * Check if a specific node can be deleted without breaking tree structure
 */
export const selectCanDeleteNode =
  (nodeId: string) => (state: { workflow: WorkflowState }) => {
    const { nodes, edges } = state.workflow;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    // Check if deleting this node would create orphaned children
    const childEdges = edges.filter((edge) => edge.source === nodeId);
    const hasChildren = childEdges.length > 0;

    // If node has children, warn about orphaning them
    return {
      canDelete: true,
      warning: hasChildren
        ? `Deleting this node will orphan ${childEdges.length} child node(s)`
        : null,
    };
  };
