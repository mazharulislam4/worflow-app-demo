import { z } from "zod";

export const apiCallNodeSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  timeout: z.number().min(1000).max(60000).default(30000),
  retries: z.number().min(0).max(5).default(3),
});

export type APICallNodeConfig = z.infer<typeof apiCallNodeSchema>;

export const apiCallNodeDefaultConfig: APICallNodeConfig = {
  url: "https://api.example.com/endpoint",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  retries: 3,
};
