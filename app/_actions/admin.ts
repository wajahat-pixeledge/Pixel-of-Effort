"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { toRoute } from "@/lib/routes";
import {
  accessRuleSchema,
  assignProjectSchema,
  createCategorySchema,
  createProjectSchema,
  createStatusSchema,
  setCategoryStatusSchema,
  setAssignmentStatusSchema,
  setProjectStatusSchema,
  setStatusFlagSchema,
  updateCategorySchema,
  updateProjectSchema,
  updateStatusSchema,
  updateUserAccessSchema,
  updateUserRoleSchema
} from "@/lib/validations/admin";

function toNullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNullableDate(value: FormDataEntryValue | null) {
  const parsed = toNullableString(value);
  return parsed ? parsed : undefined;
}

function withMessage(pathname: string, key: "error" | "message", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return toRoute(`${pathname}?${params.toString()}`);
}

export async function createProjectAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const pathname = "/admin/projects";
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: toNullableString(formData.get("description"))
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { error } = await supabase.from("projects").insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    created_by: user.id
  });

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  redirect(withMessage(pathname, "message", "Project created."));
}

export async function updateProjectAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/projects";
  const parsed = updateProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: toNullableString(formData.get("description"))
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid project update."));
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null
    })
    .eq("id", parsed.data.projectId);

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/projects");
  revalidatePath("/dashboard");
  redirect(withMessage(pathname, "message", "Project updated."));
}

export async function setProjectStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/projects";
  const parsed = setProjectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid project status."));
  }

  const isActive = parsed.data.isActive === "true";

  const { error } = await supabase
    .from("projects")
    .update({ is_active: isActive })
    .eq("id", parsed.data.projectId);

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/projects");
  revalidatePath("/dashboard");
  redirect(withMessage(pathname, "message", isActive ? "Project activated." : "Project deactivated."));
}

export async function assignProjectAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const pathname = "/admin/projects";
  const parsed = assignProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    userId: formData.get("userId"),
    activeFrom: formData.get("activeFrom"),
    activeUntil: toNullableDate(formData.get("activeUntil"))
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid assignment."));
  }

  const { error } = await supabase.from("project_assignments").upsert(
    {
      project_id: parsed.data.projectId,
      user_id: parsed.data.userId,
      active_from: parsed.data.activeFrom,
      active_until: parsed.data.activeUntil ?? null,
      is_active: true,
      assigned_by: user.id
    },
    {
      onConflict: "project_id,user_id"
    }
  );

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/projects");
  revalidatePath("/dashboard");
  redirect(withMessage(pathname, "message", "Project assigned."));
}

export async function setAssignmentStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/projects";
  const parsed = setAssignmentStatusSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid assignment status."));
  }

  const isActive = parsed.data.isActive === "true";

  const { error } = await supabase
    .from("project_assignments")
    .update({ is_active: isActive })
    .eq("id", parsed.data.assignmentId);

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/projects");
  revalidatePath("/dashboard");
  redirect(withMessage(pathname, "message", isActive ? "Assignment activated." : "Assignment deactivated."));
}

export async function updateUserAccessAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const pathname = "/admin/users";
  const parsed = updateUserAccessSchema.safeParse({
    userId: formData.get("userId"),
    accessStatus: formData.get("accessStatus")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid status update."));
  }

  const approvalMetadata =
    parsed.data.accessStatus === "approved" || parsed.data.accessStatus === "rejected"
      ? { approved_at: new Date().toISOString(), approved_by: user.id }
      : { approved_at: null, approved_by: null };

  const { error } = await supabase
    .from("profiles")
    .update({
      access_status: parsed.data.accessStatus,
      ...approvalMetadata
    })
    .eq("id", parsed.data.userId);

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  redirect(withMessage(pathname, "message", "Access updated."));
}

export async function updateUserRoleAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/users";
  const parsed = updateUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid role update."));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/users");
  redirect(withMessage(pathname, "message", "Role updated."));
}

export async function createAccessRuleAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const pathname = "/admin/users";
  const parsed = accessRuleSchema.safeParse({
    ruleType: formData.get("ruleType"),
    accessValue: formData.get("accessValue"),
    note: toNullableString(formData.get("note"))
  });

  if (!parsed.success) {
    redirect(
      withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid access rule.")
    );
  }

  const normalizedValue =
    parsed.data.ruleType === "domain"
      ? parsed.data.accessValue.toLowerCase().replace(/^@/, "")
      : parsed.data.accessValue.toLowerCase();

  const { error } = await supabase.from("access_rules").insert({
    rule_type: parsed.data.ruleType,
    access_value: normalizedValue,
    note: parsed.data.note ?? null,
    created_by: user.id
  });

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/users");
  redirect(withMessage(pathname, "message", "Access rule saved."));
}

// ---- Entry Categories ----

export async function createCategoryAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/settings";
  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    requiresProject: formData.get("requiresProject")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { error } = await supabase.from("entry_categories").insert({
    name: parsed.data.name,
    requires_project: parsed.data.requiresProject === "true"
  });

  if (error) {
    redirect(withMessage(pathname, "error", error.code === "23505" ? "A category with that name already exists." : error.message));
  }

  revalidatePath("/admin/settings");
  redirect(withMessage(pathname, "message", "Category created."));
}

export async function updateCategoryAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/settings";
  const parsed = updateCategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    requiresProject: formData.get("requiresProject")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid category update."));
  }

  const { error } = await supabase
    .from("entry_categories")
    .update({
      name: parsed.data.name,
      requires_project: parsed.data.requiresProject === "true"
    })
    .eq("id", parsed.data.categoryId);

  if (error) {
    redirect(withMessage(pathname, "error", error.code === "23505" ? "A category with that name already exists." : error.message));
  }

  revalidatePath("/admin/settings");
  redirect(withMessage(pathname, "message", "Category updated."));
}

export async function setCategoryStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/settings";
  const parsed = setCategoryStatusSchema.safeParse({
    categoryId: formData.get("categoryId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid category status."));
  }

  const isActive = parsed.data.isActive === "true";

  const { error } = await supabase
    .from("entry_categories")
    .update({ is_active: isActive })
    .eq("id", parsed.data.categoryId);

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/settings");
  redirect(withMessage(pathname, "message", isActive ? "Category activated." : "Category deactivated."));
}

// ---- Entry Statuses ----

export async function createStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/settings";
  const parsed = createStatusSchema.safeParse({
    name: formData.get("name"),
    requiresComment: formData.get("requiresComment"),
    isBlocker: formData.get("isBlocker")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { error } = await supabase.from("entry_statuses").insert({
    name: parsed.data.name,
    requires_comment: parsed.data.requiresComment === "true",
    is_blocker: parsed.data.isBlocker === "true"
  });

  if (error) {
    redirect(withMessage(pathname, "error", error.code === "23505" ? "A status with that name already exists." : error.message));
  }

  revalidatePath("/admin/settings");
  redirect(withMessage(pathname, "message", "Status created."));
}

export async function updateStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/settings";
  const parsed = updateStatusSchema.safeParse({
    statusId: formData.get("statusId"),
    name: formData.get("name"),
    requiresComment: formData.get("requiresComment"),
    isBlocker: formData.get("isBlocker")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid status update."));
  }

  const { error } = await supabase
    .from("entry_statuses")
    .update({
      name: parsed.data.name,
      requires_comment: parsed.data.requiresComment === "true",
      is_blocker: parsed.data.isBlocker === "true"
    })
    .eq("id", parsed.data.statusId);

  if (error) {
    redirect(withMessage(pathname, "error", error.code === "23505" ? "A status with that name already exists." : error.message));
  }

  revalidatePath("/admin/settings");
  redirect(withMessage(pathname, "message", "Status updated."));
}

export async function setStatusActiveAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pathname = "/admin/settings";
  const parsed = setStatusFlagSchema.safeParse({
    statusId: formData.get("statusId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    redirect(withMessage(pathname, "error", parsed.error.issues[0]?.message ?? "Invalid status toggle."));
  }

  const isActive = parsed.data.isActive === "true";

  const { error } = await supabase
    .from("entry_statuses")
    .update({ is_active: isActive })
    .eq("id", parsed.data.statusId);

  if (error) {
    redirect(withMessage(pathname, "error", error.message));
  }

  revalidatePath("/admin/settings");
  redirect(withMessage(pathname, "message", isActive ? "Status activated." : "Status deactivated."));
}

