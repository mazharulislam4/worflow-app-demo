import { z } from "zod";

export const sendEmailNodeSchema = z.object({
  to: z.string().email("Must be a valid email address"),
  cc: z.string().email().optional().or(z.literal("")),
  bcc: z.string().email().optional().or(z.literal("")),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  isHtml: z.boolean().default(false),
  attachments: z.array(z.string()).optional(),
});

export type SendEmailNodeConfig = z.infer<typeof sendEmailNodeSchema>;

export const sendEmailNodeDefaultConfig: SendEmailNodeConfig = {
  to: "",
  subject: "",
  body: "",
  isHtml: false,
};
