import { requireAdmin } from "@/lib/auth";
import { CategoryManager } from "@/components/forms/category-form";
import { StatusManager } from "@/components/forms/status-form";
import { Notice } from "@/components/ui/notice";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  const [categoriesResult, statusesResult] = await Promise.all([
    supabase
      .from("entry_categories")
      .select("id, name, is_active, requires_project, created_at, updated_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("entry_statuses")
      .select("id, name, is_active, requires_comment, is_blocker, created_at, updated_at")
      .order("created_at", { ascending: true })
  ]);

  if (categoriesResult.error || statusesResult.error) {
    throw new Error(
      categoriesResult.error?.message ??
        statusesResult.error?.message ??
        "Failed to load settings."
    );
  }

  const categories = categoriesResult.data ?? [];
  const statuses = statusesResult.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage time-entry categories and statuses. Changes take effect immediately for all users.
        </p>
      </div>

      {readParam(params, "error") ? (
        <Notice type="error" text={readParam(params, "error")!} />
      ) : null}
      {readParam(params, "message") ? (
        <Notice type="message" text={readParam(params, "message")!} />
      ) : null}

      <section className="space-y-2">
        <h3 className="text-base font-medium">Categories</h3>
        <p className="text-sm text-muted-foreground">
          Categories group time entries. Enable <strong>Requires project</strong> for project-linked work.
        </p>
        <CategoryManager categories={categories} />
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium">Statuses</h3>
        <p className="text-sm text-muted-foreground">
          Statuses flag entries for review. A <strong>blocker</strong> status surfaces in team reports.
        </p>
        <StatusManager statuses={statuses} />
      </section>
    </div>
  );
}
