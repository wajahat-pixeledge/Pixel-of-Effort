"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApprovedUser } from "@/lib/auth";
import { toRoute } from "@/lib/routes";
import { createTimeEntrySchema, updateTimeEntrySchema } from "@/lib/validations/time-entry";

function toOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function withMessage(pathname: string, key: "error" | "message", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return toRoute(`${pathname}?${params.toString()}`);
}

export async function createTimeEntryAction(formData: FormData) {
  const { supabase, user } = await requireApprovedUser();
  const pathname = "/dashboard";
  const parsed = createTimeEntrySchema.safeParse({
    workDate: formData.get("workDate"),
    hours: formData.get("hours"),
    category: formData.get("category"),
    projectId: toOptionalString(formData.get("projectId")),
    comment: toOptionalString(formData.get("comment")),
    statusFlag: toOptionalString(formData.get("statusFlag")) ?? "none"
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid time entry."));
  }

  const minutes = Math.round(parsed.data.hours * 60);

  const { error } = await supabase.from("time_entries").insert({
    user_id: user.id,
    work_date: parsed.data.workDate,
    minutes,
    category: parsed.data.category,
    project_id: parsed.data.category === "project" ? parsed.data.projectId : null,
    comment: parsed.data.comment ?? null,
    status_flag: parsed.data.statusFlag ?? null
  });

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/admin");
  redirect(withMessage(pathname, "message", "Time entry logged."));
}

export async function updateTimeEntryAction(formData: FormData) {
  const { supabase, user } = await requireApprovedUser();
  const pathname = "/history";
  const parsed = updateTimeEntrySchema.safeParse({
    timeEntryId: formData.get("timeEntryId"),
    workDate: formData.get("workDate"),
    hours: formData.get("hours"),
    category: formData.get("category"),
    projectId: toOptionalString(formData.get("projectId")),
    comment: toOptionalString(formData.get("comment")),
    statusFlag: toOptionalString(formData.get("statusFlag")) ?? "none"
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid time entry update."));
  }

  const minutes = Math.round(parsed.data.hours * 60);

  const { data: existingEntry, error: existingError } = await supabase
    .from("time_entries")
    .select("id, user_id")
    .eq("id", parsed.data.timeEntryId)
    .maybeSingle();

  if (existingError || !existingEntry || existingEntry.user_id !== user.id) {
    redirect(withMessage(pathname, "error", "You cannot edit this entry."));
  }

  const { error } = await supabase
    .from("time_entries")
    .update({
      work_date: parsed.data.workDate,
      minutes,
      category: parsed.data.category,
      project_id: parsed.data.category === "project" ? parsed.data.projectId : null,
      comment: parsed.data.comment ?? null,
      status_flag: parsed.data.statusFlag ?? null
    })
    .eq("id", parsed.data.timeEntryId)
    .eq("user_id", user.id);

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect(withMessage(pathname, "message", "Time entry updated."));
}
