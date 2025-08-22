import { z } from "zod";

export const startNodeSchema = z.object({
  description: z.string().optional().default(""),
  triggerOnStart: z.boolean().default(true),
  continueOnError: z.boolean().default(false),
});

export type StartNodeConfig = z.infer<typeof startNodeSchema>;

export const startNodeDefaultConfig: StartNodeConfig = {
  description: "",
  triggerOnStart: true,
  continueOnError: false,
};
