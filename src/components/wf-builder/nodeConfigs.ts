/**
 * Node configurations and schemas for all supported node types
 */

import { NodeConfig, NodeType, ValidationResult } from "./types";

export const NODE_CONFIGS: Record<NodeType, NodeConfig> = {
  StartNode: {
    type: "StartNode",
    inputs: 0,
    outputs: 1,
    handles: [
      {
        id: "out",
        type: "output",
        position: "right",
        required: false,
        label: "Start",
      },
    ],
    label: "Start",
    icon: "🚀",
    description: "Workflow entry point - no inputs, one output",
    defaultAttributes: {
      description: "",
      triggerOnStart: true,
      continueOnError: false,
    },
    schema: {
      description: {
        type: "textarea",
        label: "Description",
        placeholder: "Describe what this workflow does...",
      },
      triggerOnStart: {
        type: "checkbox",
        label: "Auto Start",
        default: true,
      },
      continueOnError: {
        type: "checkbox",
        label: "Continue on Error",
        default: false,
      },
    },
  },

  AddTaskNode: {
    type: "AddTaskNode",
    inputs: 1,
    outputs: 1,
    handles: [
      {
        id: "in",
        type: "input",
        position: "left",
        required: true,
        label: "Input",
      },
      {
        id: "out",
        type: "output",
        position: "right",
        required: false,
        label: "Output",
      },
    ],
    label: "Add Task",
    icon: "✓",
    description:
      "Create new tasks or assignments in your task management system",
    defaultAttributes: {
      title: "",
      description: "",
      assignee: "",
      priority: "medium",
      dueDate: "",
      tags: [],
      continueOnError: false,
    },
    schema: {
      title: {
        type: "text",
        label: "Task Title",
        placeholder: "Task title",
        required: true,
      },
      description: {
        type: "textarea",
        label: "Task Description",
        placeholder: "Detailed task description...",
      },
      assignee: {
        type: "text",
        label: "Assignee",
        placeholder: "Person or team to assign task to",
      },
      priority: {
        type: "select",
        label: "Priority Level",
        options: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      dueDate: {
        type: "date",
        label: "Due Date",
      },
      tags: {
        type: "tags",
        label: "Tags",
        placeholder: "Add tags for categorization",
      },
      continueOnError: {
        type: "checkbox",
        label: "Continue on Error",
        default: false,
      },
    },
  },

  ConditionNode: {
    type: "ConditionNode",
    inputs: 1,
    outputs: "conditional",
    handles: [
      {
        id: "in",
        type: "input",
        position: "left",
        required: true,
        label: "Input",
      },
      {
        id: "true",
        type: "output",
        position: "top",
        required: false,
        label: "True",
      },
      {
        id: "false",
        type: "output",
        position: "bottom",
        required: false,
        label: "False",
      },
    ],
    label: "Condition",
    icon: "🔀",
    description:
      "Conditional branching - evaluates conditions and routes to true or false path",
    defaultAttributes: {
      conditions: [{ field: "", operator: "equals", value: "" }],
      logic: "AND",
      continueOnError: false,
    },
    schema: {
      conditions: {
        type: "conditions",
        label: "Conditions",
        placeholder: "Define your conditions...",
      },
      logic: {
        type: "select",
        label: "Logic Operator",
        options: ["AND", "OR"],
        default: "AND",
      },
      continueOnError: {
        type: "checkbox",
        label: "Continue on Error",
        default: false,
      },
    },
  },

  APICallNode: {
    type: "APICallNode",
    inputs: 1,
    outputs: 1,
    handles: [
      {
        id: "in",
        type: "input",
        position: "left",
        required: true,
        label: "Input",
      },
      {
        id: "out",
        type: "output",
        position: "right",
        required: false,
        label: "Output",
      },
    ],
    label: "API Call",
    icon: "🌐",
    description: "Make HTTP requests to external APIs",
    defaultAttributes: {
      url: "https://jsonplaceholder.typicode.com/todos",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: "",
      timeout: 30000,
      retries: 3,
      continueOnError: false,
    },
    schema: {
      url: {
        type: "text",
        label: "API URL",
        placeholder: "https://jsonplaceholder.typicode.com/todos",
        required: true,
      },
      method: {
        type: "select",
        label: "HTTP Method",
        options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        default: "GET",
      },
      headers: {
        type: "json",
        label: "Headers",
        placeholder: '{"Content-Type": "application/json"}',
      },
      body: {
        type: "textarea",
        label: "Request Body",
        placeholder: "JSON payload for POST/PUT requests...",
      },
      timeout: {
        type: "text",
        label: "Timeout (ms)",
        default: "30000",
      },
      retries: {
        type: "text",
        label: "Retry Attempts",
        default: "3",
      },
      continueOnError: {
        type: "checkbox",
        label: "Continue on Error",
        default: false,
      },
    },
  },

  ScriptNode: {
    type: "ScriptNode",
    inputs: 1,
    outputs: 1,
    handles: [
      {
        id: "in",
        type: "input",
        position: "left",
        required: true,
        label: "Input",
      },
      {
        id: "out",
        type: "output",
        position: "right",
        required: false,
        label: "Output",
      },
    ],
    label: "Script",
    icon: "⚡",
    description: "Execute custom JavaScript code",
    defaultAttributes: {
      language: "javascript",
      code: '// Your script code here\nconsole.log("Hello from script!");',
      timeout: 60000,
      environment: {},
      continueOnError: false,
    },
    schema: {
      language: {
        type: "select",
        label: "Language",
        options: ["javascript", "python", "bash"],
        default: "javascript",
      },
      code: {
        type: "code",
        label: "Script Code",
        placeholder: "// Your script code here...",
        required: true,
      },
      timeout: {
        type: "text",
        label: "Timeout (ms)",
        default: "60000",
      },
      environment: {
        type: "json",
        label: "Environment Variables",
        placeholder: '{"VAR_NAME": "value"}',
      },
      continueOnError: {
        type: "checkbox",
        label: "Continue on Error",
        default: false,
      },
    },
  },

  /*
  SendEmailNode: {
    type: "SendEmailNode",
    inputs: 1,
    outputs: 1,
    handles: [
      {
        id: "in",
        type: "input",
        position: "left",
        required: true,
        label: "Input",
      },
      {
        id: "out",
        type: "output",
        position: "right",
        required: false,
        label: "Output",
      },
    ],
    label: "Send Email",
    icon: "📧",
    description: "Send email notifications",
    defaultAttributes: {
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: "",
      isHtml: false,
      attachments: [],
      continueOnError: false,
    },
    schema: {
      to: {
        type: "text",
        label: "To",
        placeholder: "recipient@example.com",
        required: true,
      },
      cc: {
        type: "text",
        label: "CC",
        placeholder: "cc@example.com",
      },
      bcc: {
        type: "text",
        label: "BCC",
        placeholder: "bcc@example.com",
      },
      subject: {
        type: "text",
        label: "Subject",
        placeholder: "Email subject",
        required: true,
      },
      body: {
        type: "textarea",
        label: "Email Body",
        placeholder: "Email content...",
        required: true,
      },
      isHtml: {
        type: "checkbox",
        label: "HTML Format",
        default: false,
      },
      attachments: {
        type: "tags",
        label: "Attachments",
        placeholder: "File paths...",
      },
      continueOnError: {
        type: "checkbox",
        label: "Continue on Error",
        default: false,
      },
    },
  },
  */


  runVM: {
    type: "runVM",
    inputs: 1,
    outputs: 1,
    handles: [
      {
        id: "in",
        type: "input",
        position: "left",
        required: true,
        label: "Input",
      },
      {
        id: "out",
        type: "output",
        position: "right",
        required: false,
        label: "Output",
      },
    ],
    label: "Run VM",
    icon: "🖥️",
    description: "Create and run virtual machine",
    defaultAttributes: {
      vm_name: "test-vm",
      os_type: "ubuntu",
      os_version: "20.04",
      cpu_cores: 1,
      memory_mb: 512,
      disk_gb: 5,
      auto_start: true,
      network_ports: [3000, 5000],
      environment: {
        TEST_ENV: "development"
      },
      continueOnError: false,
    },
    schema: {
      vm_name: {
        type: "text",
        label: "VM Name",
        placeholder: "Virtual machine name",
        required: true,
      },
      os_type: {
        type: "select",
        label: "OS Type",
        options: ["ubuntu", "centos", "debian", "alpine"],
        default: "ubuntu",
      },
      os_version: {
        type: "text",
        label: "OS Version",
        default: "20.04",
      },
      cpu_cores: {
        type: "text",
        label: "CPU Cores",
        default: "1",
      },
      memory_mb: {
        type: "text",
        label: "Memory (MB)",
        default: "512",
      },
      disk_gb: {
        type: "text",
        label: "Disk Space (GB)",
        default: "5",
      },
      auto_start: {
        type: "checkbox",
        label: "Auto Start",
        default: true,
      },
      network_ports: {
        type: "text",
        label: "Network Ports",
        placeholder: "3000,5000",
      },
      environment: {
        type: "json",
        label: "Environment Variables",
        placeholder: '{"TEST_ENV": "development"}',
      },
      continueOnError: {
        type: "checkbox",
        label: "Continue on Error",
        default: false,
      },
    },
  },

  runServer: {
    type: "runServer",
    inputs: 1,
    outputs: 1,
    handles: [
      {
        id: "in",
        type: "input",
        position: "left",
        required: true,
        label: "Input",
      },
      {
        id: "out",
        type: "output",
        position: "right",
        required: false,
        label: "Output",
      },
    ],
    label: "Run Server",
    icon: "🚀",
    description: "Deploy and run server application",
    defaultAttributes: {
      vm_name: "test-vm",
      app_name: "test-app",
      app_type: "node",
      server_type: "web",
      port: 3000,
      max_memory: "128m",
      auto_restart: true,
      environment: {
        NODE_ENV: "development"
      },
      continueOnError: false,
    },
    schema: {
      vm_name: {
        type: "text",
        label: "VM Name",
        placeholder: "Target virtual machine",
        required: true,
      },
      app_name: {
        type: "text",
        label: "App Name",
        placeholder: "Application name",
        required: true,
      },
      app_type: {
        type: "select",
        label: "App Type",
        options: ["node", "python", "java", "php"],
        default: "node",
      },
      server_type: {
        type: "select",
        label: "Server Type",
        options: ["web", "api", "microservice"],
        default: "web",
      },
      port: {
        type: "text",
        label: "Port",
        default: "3000",
      },
      max_memory: {
        type: "text",
        label: "Max Memory",
        default: "128m",
      },
      auto_restart: {
        type: "checkbox",
        label: "Auto Restart",
        default: true,
      },
      environment: {
        type: "json",
        label: "Environment Variables",
        placeholder: '{"NODE_ENV": "development"}',
      },
      continueOnError: {
        type: "checkbox",
        label: "Continue on Error",
        default: false,
      },
    },
  },

  EndNode: {
    type: "EndNode",
    inputs: 1,
    outputs: 0,
    handles: [
      {
        id: "in",
        type: "input",
        position: "left",
        required: true,
        label: "Input",
      },
    ],
    label: "End",
    icon: "🏁",
    description:
      "Workflow termination point - marks the end of a workflow path",
    defaultAttributes: {
      description: "",
      finalizeWorkflow: true,
      logCompletion: true,
    },
    schema: {
      description: {
        type: "textarea",
        label: "Completion Message",
        placeholder: "Describe what happens when workflow reaches this end...",
      },
      finalizeWorkflow: {
        type: "checkbox",
        label: "Finalize Workflow",
        default: true,
      },
      logCompletion: {
        type: "checkbox",
        label: "Log Completion",
        default: true,
      },
    },
  },

};

export const getNodeConfig = (nodeType: NodeType): NodeConfig => {
  const config = NODE_CONFIGS[nodeType];
  if (!config) {
    throw new Error(`Unknown node type: ${nodeType}`);
  }
  return config;
};

export const getAllNodeTypes = (): NodeType[] => {
  return Object.keys(NODE_CONFIGS) as NodeType[];
};

export const createNodeHandles = (nodeType: NodeType) => {
  const config = getNodeConfig(nodeType);
  return [...config.handles];
};

export const getNodeDefaultConfig = (
  nodeType: NodeType
): Record<string, any> => {
  const config = getNodeConfig(nodeType);
  return { ...config.defaultAttributes };
};

export const validateNodeConfig = (
  nodeType: NodeType,
  config: Record<string, any>
): ValidationResult => {
  const nodeConfig = getNodeConfig(nodeType);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  Object.entries(nodeConfig.schema).forEach(([key, fieldSchema]) => {
    if (fieldSchema.required && (!config[key] || config[key] === "")) {
      errors.push(`${fieldSchema.label} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
