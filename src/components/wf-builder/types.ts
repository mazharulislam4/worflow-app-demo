/**
 * Core type definitions for DAG Workflow Builder
 */

export type NodeType =
  | "StartNode"
  | "AddTaskNode"
  | "ConditionNode"
  | "APICallNode"
  | "ScriptNode"
  | "runServer"
  | "runVM"
  // | "SendEmailNode"
  | "EndNode";

export interface Position {
  x: number;
  y: number;
}

export interface Handle {
  id: string;
  type: "input" | "output";
  position: "top" | "bottom" | "left" | "right";
  required?: boolean;
  label?: string;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: Position;
  data: {
    label: string;
    config: Record<string, any>;
  };
  handles: Handle[];
}

export interface WorkflowEdge {
  id: string;
  from: string;
  output: string;
  to: string;
  input: string;
}

export interface UIWorkflowConfig {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface JobConnection {
  targetJobId: string;
  condition: string; // "default", "true", "false", etc.
}

export interface JobDependency {
  sourceJobId: string;
  condition: string; // "default", "true", "false", etc.
}

export interface ExecutionFlow {
  startNode: string | null;
  totalJobs: number;
  hasConditionalFlow: boolean;
}

export interface BackendJob {
  type: string;
  attributes: Record<string, any>;
  connections: JobConnection[];
  dependencies: JobDependency[];
  isConditional: boolean;
}

export interface BackendJobsConfig {
  jobs: BackendJob[];
  executionFlow: ExecutionFlow;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConnectionValidation {
  canConnect: boolean;
  reason?: string;
}

export interface FieldSchema {
  type:
    | "text"
    | "textarea"
    | "select"
    | "checkbox"
    | "tags"
    | "json"
    | "code"
    | "date"
    | "conditions";
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  default?: any;
}

export interface NodeConfigSchema {
  [key: string]: FieldSchema;
}

export interface NodeConfig {
  type: NodeType;
  inputs: number;
  outputs: number | "conditional";
  handles: Handle[];
  label: string;
  icon: string;
  description: string;
  defaultAttributes: Record<string, any>;
  schema: NodeConfigSchema;
}

export interface AddNodeContext {
  position: Position;
  afterNodeId?: string;
  direction?: "top" | "bottom" | "left" | "right";
}

// Component prop interfaces
export interface WorkflowNodeProps {
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

export interface NodePaletteProps {
  onNodeSelect: (nodeType: NodeType) => void;
  selectedNodeType: NodeType | null;
  isAddingNode: boolean;
  onCancelAdd: () => void;
}

export interface NodePropertiesProps {
  node: WorkflowNode | null;
  onUpdateNode: (
    nodeId: string,
    updates: Partial<WorkflowNode["data"]>
  ) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onClose?: () => void;
}

export interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeAdd: (
    type: NodeType,
    position: { x: number; y: number },
    afterNodeId?: string,
    direction?: "top" | "bottom" | "left" | "right"
  ) => void;
  onEdgeAdd: (
    fromNodeId: string,
    outputHandle: string,
    toNodeId: string,
    inputHandle: string
  ) => boolean;
  onEdgeDelete: (edgeId: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  getNodesNeedingConnections: () => {
    nodeId: string;
    missingHandles: string[];
  }[];
  selectedNodeType: NodeType | null;
  isAddingNode: boolean;
  onAddNodeComplete: () => void;
}
