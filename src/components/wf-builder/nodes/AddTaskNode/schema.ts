import { z } from "zod";

export const addTaskNodeSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().default(""),
  assignee: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional().default(""),
  tags: z.array(z.string()).default([]),
  continueOnError: z.boolean().default(false),
});

export type AddTaskNodeConfig = z.infer<typeof addTaskNodeSchema>;

export const addTaskNodeDefaultConfig: AddTaskNodeConfig = {
  title: "",
  description: "",
  assignee: "",
  priority: "medium",
  dueDate: "",
  tags: [],
  continueOnError: false,
};
