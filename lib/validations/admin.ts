import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name is too short.").max(120),
  description: z.string().trim().max(500).optional()
});

export const updateProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project id."),
  name: z.string().trim().min(2, "Project name is too short.").max(120),
  description: z.string().trim().max(500).optional()
});

export const setProjectStatusSchema = z.object({
  projectId: z.string().uuid("Invalid project id."),
  isActive: z.enum(["true", "false"])
});

export const assignProjectSchema = z
  .object({
    projectId: z.string().uuid("Invalid project id."),
    userId: z.string().uuid("Invalid user id."),
    activeFrom: z.string().date("Active from date is invalid."),
    activeUntil: z.string().date("Active until date is invalid.").optional()
  })
  .superRefine((value, context) => {
    if (value.activeUntil && value.activeUntil < value.activeFrom) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeUntil"],
        message: "Active until must be on or after active from."
      });
    }
  });

export const setAssignmentStatusSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment id."),
  isActive: z.enum(["true", "false"])
});

export const updateUserAccessSchema = z.object({
  userId: z.string().uuid("Invalid user id."),
  accessStatus: z.enum(["approved", "pending", "rejected"])
});

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("Invalid user id."),
  role: z.enum(["admin", "user"])
});

export const accessRuleSchema = z.object({
  ruleType: z.enum(["domain", "email", "pattern"]),
  accessValue: z
    .string()
    .trim()
    .min(3, "Rule value is too short.")
    .max(255, "Rule value is too long."),
  note: z.string().trim().max(255).optional()
});
