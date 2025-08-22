import { NodeType } from "../types";
import { APICallNodeComponent } from "./APICallNode/APICallNodeComponent";
import {
  APICallNodeConfig,
  apiCallNodeDefaultConfig,
  apiCallNodeSchema,
} from "./APICallNode/schema";
import { AddTaskNodeComponent } from "./AddTaskNode/AddTaskNodeComponent";
import {
  AddTaskNodeConfig,
  addTaskNodeDefaultConfig,
  addTaskNodeSchema,
} from "./AddTaskNode/schema";
import { ConditionNodeComponent } from "./ConditionNode/ConditionNodeComponent";
import {
  ConditionNodeConfig,
  conditionNodeDefaultConfig,
  conditionNodeSchema,
} from "./ConditionNode/schema";
import { EndNodeComponent } from "./EndNode/EndNodeComponent";
import {
  defaultEndNodeConfig,
  EndNodeConfig,
  endNodeSchema,
} from "./EndNode/schema";
import { RunServerNodeComponent } from "./RunServerNode/RunServerNodeComponent";
import {
  RunServerNodeConfig,
  runServerNodeDefaultConfig,
  runServerNodeSchema,
} from "./RunServerNode/schema";
import { RunVMNodeComponent } from "./RunVMNode/RunVMNodeComponent";
import {
  RunVMNodeConfig,
  runVMNodeDefaultConfig,
  runVMNodeSchema,
} from "./RunVMNode/schema";
import { ScriptNodeComponent } from "./ScriptNode/ScriptNodeComponent";
import {
  ScriptNodeConfig,
  scriptNodeDefaultConfig,
  scriptNodeSchema,
} from "./ScriptNode/schema";
// import { SendEmailNodeComponent } from "./SendEmailNode/SendEmailNodeComponent";
// import {
//   SendEmailNodeConfig,
//   sendEmailNodeDefaultConfig,
//   sendEmailNodeSchema,
// } from "./SendEmailNode/schema";
import { StartNodeComponent } from "./StartNode/StartNodeComponent";
import {
  StartNodeConfig,
  startNodeDefaultConfig,
  startNodeSchema,
} from "./StartNode/schema";

// Base node interface
export interface BaseNodeDefinition {
  type: NodeType;
  component: React.ComponentType<any>;
  schema: any;
  defaultConfig: any;
  label: string;
  icon: string;
  description: string;
  category: string;
  inputs: number;
  outputs: number;
  handles: Array<{
    id: string;
    type: "input" | "output";
    position: string;
    label?: string;
  }>;
}

// Specific node definitions
export interface StartNodeDefinition extends BaseNodeDefinition {
  type: "StartNode";
  component: typeof StartNodeComponent;
  schema: typeof startNodeSchema;
  defaultConfig: StartNodeConfig;
}

export interface AddTaskNodeDefinition extends BaseNodeDefinition {
  type: "AddTaskNode";
  component: typeof AddTaskNodeComponent;
  schema: typeof addTaskNodeSchema;
  defaultConfig: AddTaskNodeConfig;
}

export interface ConditionNodeDefinition extends BaseNodeDefinition {
  type: "ConditionNode";
  component: typeof ConditionNodeComponent;
  schema: typeof conditionNodeSchema;
  defaultConfig: ConditionNodeConfig;
}

export interface APICallNodeDefinition extends BaseNodeDefinition {
  type: "APICallNode";
  component: typeof APICallNodeComponent;
  schema: typeof apiCallNodeSchema;
  defaultConfig: APICallNodeConfig;
}

export interface ScriptNodeDefinition extends BaseNodeDefinition {
  type: "ScriptNode";
  component: typeof ScriptNodeComponent;
  schema: typeof scriptNodeSchema;
  defaultConfig: ScriptNodeConfig;
}

/*
export interface SendEmailNodeDefinition extends BaseNodeDefinition {
  type: "SendEmailNode";
  component: typeof SendEmailNodeComponent;
  schema: typeof sendEmailNodeSchema;
  defaultConfig: SendEmailNodeConfig;
}
*/

export interface EndNodeDefinition extends BaseNodeDefinition {
  type: "EndNode";
  component: typeof EndNodeComponent;
  schema: typeof endNodeSchema;
  defaultConfig: EndNodeConfig;
}

export interface RunVMNodeDefinition extends BaseNodeDefinition {
  type: "runVM";
  component: typeof RunVMNodeComponent;
  schema: typeof runVMNodeSchema;
  defaultConfig: RunVMNodeConfig;
}

export interface RunServerNodeDefinition extends BaseNodeDefinition {
  type: "runServer";
  component: typeof RunServerNodeComponent;
  schema: typeof runServerNodeSchema;
  defaultConfig: RunServerNodeConfig;
}

// Node definitions
const startNode: StartNodeDefinition = {
  type: "StartNode",
  component: StartNodeComponent,
  schema: startNodeSchema,
  defaultConfig: startNodeDefaultConfig,
  label: "Start",
  icon: "🚀",
  description: "Entry point for the workflow",
  category: "Control",
  inputs: 0,
  outputs: 1,
  handles: [{ id: "out", type: "output", position: "right" }],
};

const addTaskNode: AddTaskNodeDefinition = {
  type: "AddTaskNode",
  component: AddTaskNodeComponent,
  schema: addTaskNodeSchema,
  defaultConfig: addTaskNodeDefaultConfig,
  label: "Add Task",
  icon: "✓",
  description: "Create a new task",
  category: "Actions",
  inputs: 1,
  outputs: 1,
  handles: [
    { id: "in", type: "input", position: "left" },
    { id: "out", type: "output", position: "right" },
  ],
};

const conditionNode: ConditionNodeDefinition = {
  type: "ConditionNode",
  component: ConditionNodeComponent,
  schema: conditionNodeSchema,
  defaultConfig: conditionNodeDefaultConfig,
  label: "Condition",
  icon: "🔀",
  description: "Branch workflow based on conditions",
  category: "Control",
  inputs: 1,
  outputs: 2,
  handles: [
    { id: "in", type: "input", position: "left" },
    { id: "true", type: "output", position: "top", label: "True" },
    { id: "false", type: "output", position: "bottom", label: "False" },
  ],
};

const apiCallNode: APICallNodeDefinition = {
  type: "APICallNode",
  component: APICallNodeComponent,
  schema: apiCallNodeSchema,
  defaultConfig: apiCallNodeDefaultConfig,
  label: "API Call",
  icon: "🌐",
  description: "Make HTTP requests to external APIs",
  category: "Actions",
  inputs: 1,
  outputs: 1,
  handles: [
    { id: "in", type: "input", position: "left" },
    { id: "out", type: "output", position: "right" },
  ],
};

const scriptNode: ScriptNodeDefinition = {
  type: "ScriptNode",
  component: ScriptNodeComponent,
  schema: scriptNodeSchema,
  defaultConfig: scriptNodeDefaultConfig,
  label: "Script",
  icon: "⚡",
  description: "Execute custom JavaScript code",
  category: "Actions",
  inputs: 1,
  outputs: 1,
  handles: [
    { id: "in", type: "input", position: "left" },
    { id: "out", type: "output", position: "right" },
  ],
};

/*
const sendEmailNode: SendEmailNodeDefinition = {
  type: "SendEmailNode",
  component: SendEmailNodeComponent,
  schema: sendEmailNodeSchema,
  defaultConfig: sendEmailNodeDefaultConfig,
  label: "Send Email",
  icon: "📧",
  description: "Send email notifications",
  category: "Actions",
  inputs: 1,
  outputs: 1,
  handles: [
    { id: "in", type: "input", position: "left" },
    { id: "out", type: "output", position: "right" },
  ],
};
*/

const endNode: EndNodeDefinition = {
  type: "EndNode",
  component: EndNodeComponent,
  schema: endNodeSchema,
  defaultConfig: defaultEndNodeConfig,
  label: "End",
  icon: "🏁",
  description: "Workflow termination point",
  category: "Control",
  inputs: 1,
  outputs: 0,
  handles: [{ id: "in", type: "input", position: "left" }],
};

const runVMNode: RunVMNodeDefinition = {
  type: "runVM",
  component: RunVMNodeComponent,
  schema: runVMNodeSchema,
  defaultConfig: runVMNodeDefaultConfig,
  label: "Run VM",
  icon: "🖥️",
  description: "Create and run virtual machine",
  category: "Infrastructure",
  inputs: 1,
  outputs: 1,
  handles: [
    { id: "in", type: "input", position: "left" },
    { id: "out", type: "output", position: "right" },
  ],
};

const runServerNode: RunServerNodeDefinition = {
  type: "runServer",
  component: RunServerNodeComponent,
  schema: runServerNodeSchema,
  defaultConfig: runServerNodeDefaultConfig,
  label: "Run Server",
  icon: "🚀",
  description: "Deploy and run server application",
  category: "Infrastructure",
  inputs: 1,
  outputs: 1,
  handles: [
    { id: "in", type: "input", position: "left" },
    { id: "out", type: "output", position: "right" },
  ],
};

// Main nodes array
export const nodes = [
  startNode,
  addTaskNode,
  conditionNode,
  apiCallNode,
  scriptNode,
  runVMNode,
  runServerNode,
  // sendEmailNode,
  endNode,
];

// Helper functions
export const getNodeDefinition = (type: NodeType) => {
  return nodes.find((node) => node.type === type);
};

export const getNodeComponent = (type: NodeType) => {
  return getNodeDefinition(type)?.component;
};

export const getNodeSchema = (type: NodeType) => {
  return getNodeDefinition(type)?.schema;
};

export const getNodeDefaultConfig = (type: NodeType) => {
  return getNodeDefinition(type)?.defaultConfig;
};

// Export types for component props
export type NodeDefinition =
  | StartNodeDefinition
  | AddTaskNodeDefinition
  | ConditionNodeDefinition
  | APICallNodeDefinition
  | ScriptNodeDefinition
  | RunVMNodeDefinition
  | RunServerNodeDefinition
  // | SendEmailNodeDefinition
  | EndNodeDefinition;
