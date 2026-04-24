import {
  createCategoryAction,
  setCategoryStatusAction,
  updateCategoryAction
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

type Category = Tables<"entry_categories">;

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
          <CardDescription>
            Create a new time-entry category. Names must be unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCategoryAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
              <div className="space-y-1">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  name="name"
                  placeholder="e.g. Training"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-requires-project">Requires project</Label>
                <Select id="cat-requires-project" name="requiresProject">
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
          <CardTitle>Categories</CardTitle>
          <CardDescription>All time-entry categories</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Requires project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.requires_project ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Badge variant={cat.is_active ? "default" : "secondary"}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form
                        action={updateCategoryAction}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="categoryId" value={cat.id} />
                        <Input
                          name="name"
                          defaultValue={cat.name}
                          className="w-36"
                          required
                        />
                        <Select
                          name="requiresProject"
                          defaultValue={cat.requires_project ? "true" : "false"}
                          className="w-28"
                        >
                          <option value="false">No project</option>
                          <option value="true">Requires project</option>
                        </Select>
                        <Button type="submit" size="sm" variant="outline">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <form action={setCategoryStatusAction}>
                        <input type="hidden" name="categoryId" value={cat.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={cat.is_active ? "false" : "true"}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant={cat.is_active ? "secondary" : "default"}
                        >
                          {cat.is_active ? "Deactivate" : "Activate"}
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
