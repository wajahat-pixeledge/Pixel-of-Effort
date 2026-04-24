import { requireApprovedUser } from "@/lib/auth";
import { MonthCalendar } from "@/components/shared/month-calendar";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Returns true if YYYY-MM-DD falls on Sat (6) or Sun (0). */
function isWeekend(dateStr: string): boolean {
  const dow = new Date(dateStr).getDay();
  return dow === 0 || dow === 6;
}

/** Count Mon-Fri days in a given year/month (1-indexed). */
function countWorkdays(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { supabase, user, profile } = await requireApprovedUser();
  const params = await searchParams;

  // Resolve target month from ?month=YYYY-MM, default to current month.
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const monthParam = readParam(params, "month");
  let year: number;
  let month: number; // 1-indexed

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    [year, month] = monthParam.split("-").map(Number);
  } else {
    year = today.getFullYear();
    month = today.getMonth() + 1;
  }

  // Admin can view all users. ?scope=all enables it for admin.
  const scopeParam = readParam(params, "scope");
  const isAdmin = profile.role === "admin";
  const scopeAll = isAdmin && scopeParam === "all";
  const userScope: "own" | "all" = scopeAll ? "all" : "own";

  const firstDay = `${year}-${pad2(month)}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const lastDay = `${year}-${pad2(month)}-${pad2(daysInMonth)}`;

  // Single efficient query: all entries for the month.
  let query = supabase
    .from("time_entries")
    .select("work_date, minutes")
    .gte("work_date", firstDay)
    .lte("work_date", lastDay);

  if (!scopeAll) {
    query = query.eq("user_id", user.id);
  }

  const { data: entries, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Aggregate minutes per day.
  const minutesByDate = new Map<string, number>();
  for (const entry of entries ?? []) {
    minutesByDate.set(
      entry.work_date,
      (minutesByDate.get(entry.work_date) ?? 0) + entry.minutes
    );
  }

  // Build DayData array for the entire month.
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${pad2(month)}-${pad2(d)}`;
    return {
      date: dateStr,
      totalMinutes: minutesByDate.get(dateStr) ?? 0,
      isWeekend: isWeekend(dateStr),
      isCurrentMonth: true
    };
  });

  // Monthly summary
  const workdayCount = countWorkdays(year, month);
  const totalLoggedMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
  const zeroDays = days.filter((d) => !d.isWeekend && d.totalMinutes === 0 && d.date <= todayStr).length;

  const summary = { totalLoggedMinutes, workdayCount, zeroDays };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Effort calendar</h2>
          <p className="text-sm text-muted-foreground">
            Daily and monthly overview of logged effort.
          </p>
        </div>

        {/* Admin scope toggle */}
        {isAdmin && (
          <div className="flex rounded-md border border-border overflow-hidden text-sm font-medium">
            <a
              href={`/dashboard/calendar?month=${year}-${pad2(month)}`}
              className={`px-4 py-2 transition ${
                userScope === "own"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/10"
              }`}
            >
              My effort
            </a>
            <a
              href={`/dashboard/calendar?month=${year}-${pad2(month)}&scope=all`}
              className={`px-4 py-2 transition ${
                userScope === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/10"
              }`}
            >
              All users
            </a>
          </div>
        )}
      </div>

      <MonthCalendar
        year={year}
        month={month}
        days={days}
        summary={summary}
        today={todayStr}
        userScope={userScope}
      />
    </div>
  );
}
