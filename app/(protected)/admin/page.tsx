import { requireAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatHours(minutes: number) {
  return (minutes / 60).toFixed(2);
}

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [usersCountResult, pendingCountResult, projectsCountResult, weekEntriesResult, recentEntriesResult] =
    await Promise.all([
      supabase.from("profiles").select("*", { head: true, count: "exact" }),
      supabase
        .from("profiles")
        .select("*", { head: true, count: "exact" })
        .eq("access_status", "pending"),
      supabase.from("projects").select("*", { head: true, count: "exact" }),
      supabase.from("time_entries").select("minutes").gte("work_date", sevenDaysAgo),
      supabase
        .from("time_entries")
        .select("id, user_id, project_id, category, work_date, minutes, status_flag")
        .order("created_at", { ascending: false })
        .limit(12)
    ]);

  if (
    usersCountResult.error ||
    pendingCountResult.error ||
    projectsCountResult.error ||
    weekEntriesResult.error ||
    recentEntriesResult.error
  ) {
    throw new Error(
      usersCountResult.error?.message ??
        pendingCountResult.error?.message ??
        projectsCountResult.error?.message ??
        weekEntriesResult.error?.message ??
        recentEntriesResult.error?.message ??
        "Failed to load admin dashboard."
    );
  }

  const recentEntries = recentEntriesResult.data ?? [];
  const weekMinutes = (weekEntriesResult.data ?? []).reduce(
    (sum, entry) => sum + entry.minutes,
    0
  );

  const userIds = [...new Set(recentEntries.map((entry) => entry.user_id))];
  const projectIds = [...new Set(recentEntries.map((entry) => entry.project_id).filter(Boolean))] as string[];

  const [profileResult, projectResult] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, email").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (profileResult.error || projectResult.error) {
    throw new Error(profileResult.error?.message ?? projectResult.error?.message ?? "Failed to load metadata.");
  }

  const emailById = new Map((profileResult.data ?? []).map((entry) => [entry.id, entry.email]));
  const projectById = new Map((projectResult.data ?? []).map((entry) => [entry.id, entry.name]));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total users</CardDescription>
            <CardTitle className="text-2xl">{usersCountResult.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending approvals</CardDescription>
            <CardTitle className="text-2xl">{pendingCountResult.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Projects</CardDescription>
            <CardTitle className="text-2xl">{projectsCountResult.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Hours in last 7 days</CardDescription>
            <CardTitle className="text-2xl">{formatHours(weekMinutes)}h</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent team activity</CardTitle>
          <CardDescription>Latest 12 time entries across users</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team entries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.work_date}</TableCell>
                    <TableCell>{emailById.get(entry.user_id) ?? entry.user_id}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>
                      {entry.project_id ? projectById.get(entry.project_id) ?? "Archived" : "-"}
                    </TableCell>
                    <TableCell>{entry.minutes}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status_flag === "blocked" ? "destructive" : "secondary"}>
                        {entry.status_flag ?? "none"}
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
  );
}
