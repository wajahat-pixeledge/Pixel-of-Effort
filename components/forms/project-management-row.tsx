import { setProjectStatusAction, updateProjectAction } from "@/app/_actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProjectManagementRowProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
  };
}

export function ProjectManagementRow({ project }: ProjectManagementRowProps) {
  return (
    <div className="flex min-w-[360px] flex-col gap-2">
      <form action={updateProjectAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input type="hidden" name="projectId" value={project.id} />
        <Input name="name" defaultValue={project.name} required />
        <Input name="description" defaultValue={project.description ?? ""} placeholder="Description" />
        <Button type="submit" size="sm" variant="outline">
          Save
        </Button>
      </form>
      <form action={setProjectStatusAction}>
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="isActive" value={project.is_active ? "false" : "true"} />
        <Button
          type="submit"
          size="sm"
          variant={project.is_active ? "secondary" : "default"}
          className="w-fit"
        >
          {project.is_active ? "Deactivate" : "Activate"}
        </Button>
      </form>
    </div>
  );
}
