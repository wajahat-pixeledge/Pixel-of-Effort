import type { Enums } from "@/lib/database.types";

export const TIME_ENTRY_CATEGORY_OPTIONS: Array<{
  value: Enums<"time_entry_category">;
  label: string;
}> = [
  { value: "project", label: "Project" },
  { value: "time_off", label: "Time off" },
  { value: "office_process", label: "Office process" },
  { value: "free_open", label: "Free/Open to projects" }
];

export const TIME_ENTRY_STATUS_OPTIONS: Array<{
  value: Enums<"time_entry_status_flag">;
  label: string;
}> = [
  { value: "none", label: "None" },
  { value: "needs_review", label: "Needs review" },
  { value: "blocked", label: "Blocked" }
];

export function accessStatusLabel(status: Enums<"access_status">) {
  if (status === "approved") {
    return "Approved";
  }
  if (status === "rejected") {
    return "Rejected";
  }
  return "Pending";
}
