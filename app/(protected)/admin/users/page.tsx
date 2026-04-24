import { updateUserAccessAction, updateUserRoleAction } from "@/app/_actions/admin";
import { requireAdmin } from "@/lib/auth";
import { accessStatusLabel } from "@/lib/constants";
import { AllowlistForm } from "@/components/forms/allowlist-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  const [profilesResult, rulesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, role, access_status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("access_rules")
      .select("id, rule_type, access_value, note, is_active, created_at")
      .order("created_at", { ascending: false })
  ]);

  if (profilesResult.error || rulesResult.error) {
    throw new Error(
      profilesResult.error?.message ?? rulesResult.error?.message ?? "Failed to load user management data."
    );
  }

  const users = profilesResult.data ?? [];
  const rules = rulesResult.data ?? [];

  return (
    <div className="space-y-6">
      {readParam(params, "error") ? <Notice type="error" text={readParam(params, "error")!} /> : null}
      {readParam(params, "message") ? (
        <Notice type="message" text={readParam(params, "message")!} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AllowlistForm />
          <Card>
            <CardHeader>
              <CardTitle>Access rules</CardTitle>
              <CardDescription>Active rules auto-approve users during first sign-in.</CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">No access rules yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.rule_type}</TableCell>
                        <TableCell className="font-mono text-xs">{rule.access_value}</TableCell>
                        <TableCell>{rule.note ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User access</CardTitle>
          <CardDescription>Approve/reject users and manage admin role.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user records found yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Current access</TableHead>
                  <TableHead>Access update</TableHead>
                  <TableHead>Role update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.access_status === "approved"
                            ? "default"
                            : user.access_status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {accessStatusLabel(user.access_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form action={updateUserAccessAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <Select name="accessStatus" defaultValue={user.access_status} className="min-w-36">
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </Select>
                        <Button type="submit" size="sm" variant="outline">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <form action={updateUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <Select name="role" defaultValue={user.role} className="min-w-28">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </Select>
                        <Button type="submit" size="sm" variant="outline">
                          Save
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
