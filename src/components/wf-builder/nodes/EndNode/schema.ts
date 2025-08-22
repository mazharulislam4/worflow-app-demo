import { z } from "zod";

export const endNodeSchema = z.object({
  nodeType: z.literal("EndNode"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
});

export type EndNodeConfig = z.infer<typeof endNodeSchema>;

export const defaultEndNodeConfig: EndNodeConfig = {
  nodeType: "EndNode",
  label: "End",
  description: "Workflow termination point",
};
