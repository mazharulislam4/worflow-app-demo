import { z } from "zod";

export const runServerNodeSchema = z.object({
  vm_name: z.string().min(1, "VM name is required"),
  app_name: z.string().min(1, "App name is required"),
  app_type: z.enum(["node", "python", "java", "php"]).default("node"),
  server_type: z.enum(["web", "api", "microservice"]).default("web"),
  port: z.number().min(1).max(65535).default(3000),
  max_memory: z.string().default("128m"),
  auto_restart: z.boolean().default(true),
  environment: z.record(z.string(), z.string()).default({}),
  continueOnError: z.boolean().default(false),
});

export type RunServerNodeConfig = z.infer<typeof runServerNodeSchema>;

export const runServerNodeDefaultConfig: RunServerNodeConfig = {
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
  
};
