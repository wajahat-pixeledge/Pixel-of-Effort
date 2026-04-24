import { updateTimeEntryAction } from "@/app/_actions/time-entries";
import { TIME_ENTRY_CATEGORY_OPTIONS, TIME_ENTRY_STATUS_OPTIONS } from "@/lib/constants";
import type { Enums } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TimeEntryEditFormProps {
  entry: {
    id: string;
    work_date: string;
    minutes: number;
    category: Enums<"time_entry_category">;
    project_id: string | null;
    status_flag: Enums<"time_entry_status_flag"> | null;
    comment: string | null;
  };
  projectOptions: Array<{ id: string; name: string }>;
}

function minutesToHours(minutes: number) {
  const value = minutes / 60;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function TimeEntryEditForm({ entry, projectOptions }: TimeEntryEditFormProps) {
  return (
    <details>
      <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
        Edit entry
      </summary>
      <form action={updateTimeEntryAction} className="mt-3 grid gap-3 rounded-md border border-border p-3">
        <input type="hidden" name="timeEntryId" value={entry.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`workDate-${entry.id}`}>Date</Label>
            <Input id={`workDate-${entry.id}`} name="workDate" type="date" defaultValue={entry.work_date} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`hours-${entry.id}`}>Hours</Label>
            <Input
              id={`hours-${entry.id}`}
              name="hours"
              type="number"
              min={0.25}
              max={24}
              step={0.25}
              defaultValue={minutesToHours(entry.minutes)}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`category-${entry.id}`}>Category</Label>
            <Select id={`category-${entry.id}`} name="category" defaultValue={entry.category}>
              {TIME_ENTRY_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`projectId-${entry.id}`}>Project</Label>
            <Select id={`projectId-${entry.id}`} name="projectId" defaultValue={entry.project_id ?? ""}>
              <option value="">No project</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`statusFlag-${entry.id}`}>Status</Label>
            <Select id={`statusFlag-${entry.id}`} name="statusFlag" defaultValue={entry.status_flag ?? "none"}>
              {TIME_ENTRY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`comment-${entry.id}`}>Comment</Label>
          <Textarea id={`comment-${entry.id}`} name="comment" defaultValue={entry.comment ?? ""} />
        </div>
        <div>
          <Button type="submit" size="sm">
            Save changes
          </Button>
        </div>
      </form>
    </details>
  );
}
