import { z } from "zod";

export const conditionNodeSchema = z.object({
  conditions: z
    .array(
      z.object({
        field: z.string().min(1, "Field is required"),
        operator: z.enum([
          "equals",
          "not_equals",
          "greater_than",
          "less_than",
          "contains",
          "not_contains",
          "is_empty",
          "is_not_empty",
        ]),
        value: z.string().default(""),
      })
    )
    .min(1, "At least one condition is required"),
  logic: z.enum(["AND", "OR"]).default("AND"),
  continueOnError: z.boolean().default(false),
});

export type ConditionNodeConfig = z.infer<typeof conditionNodeSchema>;

export const conditionNodeDefaultConfig: ConditionNodeConfig = {
  conditions: [
    {
      field: "",
      operator: "equals",
      value: "",
    },
  ],
  logic: "AND",
  continueOnError: false,
};
