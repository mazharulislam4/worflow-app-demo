import { z } from "zod";

export const scriptNodeSchema = z.object({
  language: z.enum(["javascript", "python", "bash"]).default("javascript"),
  code: z.string().min(1, "Script code is required"),
  timeout: z.number().min(1000).max(300000).default(60000),
  environment: z.record(z.string(), z.string()).optional(),
});

export type ScriptNodeConfig = z.infer<typeof scriptNodeSchema>;

export const scriptNodeDefaultConfig: ScriptNodeConfig = {
  language: "javascript",
  code: '// Your script code here\nconsole.log("Hello from script!");',
  timeout: 60000,
  environment: {},
};
