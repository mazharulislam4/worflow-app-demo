import { z } from "zod";

// Form field types
export type FieldType = 
  | "text" 
  | "email" 
  | "number" 
  | "textarea" 
  | "select" 
  | "checkbox" 
  | "radio";

// Form field schema
export const formFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Field name is required"), // Database field name
  type: z.enum(["text", "email", "number", "textarea", "select", "checkbox", "radio"]),
  label: z.string().min(1, "Label is required"),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select and radio fields
  defaultValue: z.any().optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;
