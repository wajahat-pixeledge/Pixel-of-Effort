import { z } from "zod";

export const createTimeEntrySchema = z
  .object({
    workDate: z.string().date("Enter a valid date."),
    hours: z.coerce
      .number()
      .positive("Hours must be greater than 0.")
      .max(24, "Hours cannot exceed 24."),
    category: z.enum(["project", "time_off", "office_process", "free_open"]),
    projectId: z.string().uuid().optional(),
    comment: z.string().trim().max(1000).optional(),
    statusFlag: z.enum(["none", "needs_review", "blocked"]).optional()
  })
  .superRefine((value, context) => {
    if (value.category === "project" && !value.projectId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectId"],
        message: "Project is required when category is Project."
      });
    }

    if (value.category !== "project" && value.projectId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectId"],
        message: "Project must be empty for non-project categories."
      });
    }
  });

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;

export const updateTimeEntrySchema = createTimeEntrySchema.extend({
  timeEntryId: z.string().uuid("Invalid time entry id.")
});

export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
