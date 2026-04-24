import {
  createStatusAction,
  setStatusActiveAction,
  updateStatusAction
} from "@/app/_actions/admin";
import type { Tables } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type EntryStatus = Tables<"entry_statuses">;

interface StatusManagerProps {
  statuses: EntryStatus[];
}

export function StatusManager({ statuses }: StatusManagerProps) {
  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Add status</CardTitle>
          <CardDescription>
            Create a new time-entry status. Names must be unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createStatusAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto]">
              <div className="space-y-1">
                <Label htmlFor="status-name">Name</Label>
                <Input
                  id="status-name"
                  name="name"
                  placeholder="e.g. In Progress"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status-requires-comment">Requires comment</Label>
                <Select id="status-requires-comment" name="requiresComment">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status-is-blocker">Is blocker</Label>
                <Select id="status-is-blocker" name="isBlocker">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit">Create</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Statuses</CardTitle>
          <CardDescription>All time-entry statuses</CardDescription>
        </CardHeader>
        <CardContent>
          {statuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No statuses yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Requires comment</TableHead>
                  <TableHead>Is blocker</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.requires_comment ? "Yes" : "No"}</TableCell>
                    <TableCell>{s.is_blocker ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form
                        action={updateStatusAction}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="statusId" value={s.id} />
                        <Input
                          name="name"
                          defaultValue={s.name}
                          className="w-32"
                          required
                        />
                        <Select
                          name="requiresComment"
                          defaultValue={s.requires_comment ? "true" : "false"}
                          className="w-28"
                        >
                          <option value="false">No comment</option>
                          <option value="true">Needs comment</option>
                        </Select>
                        <Select
                          name="isBlocker"
                          defaultValue={s.is_blocker ? "true" : "false"}
                          className="w-28"
                        >
                          <option value="false">Not a blocker</option>
                          <option value="true">Is blocker</option>
                        </Select>
                        <Button type="submit" size="sm" variant="outline">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <form action={setStatusActiveAction}>
                        <input type="hidden" name="statusId" value={s.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={s.is_active ? "false" : "true"}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant={s.is_active ? "secondary" : "default"}
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
