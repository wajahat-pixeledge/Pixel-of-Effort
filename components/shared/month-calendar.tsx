"use client";

import Link from "next/link";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DayData {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  isWeekend: boolean;
  isCurrentMonth: boolean;
}

interface MonthlySummary {
  totalLoggedMinutes: number;
  workdayCount: number; // Mon-Fri days in month
  zeroDays: number; // workdays with 0 logged
}

interface MonthCalendarProps {
  year: number;
  month: number; // 1-indexed
  days: DayData[];
  summary: MonthlySummary;
  /** ISO YYYY-MM-DD of today for highlight */
  today: string;
  /** For admin: "all" | userId; for user: always "own" */
  userScope: "own" | "all";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtHours(minutes: number) {
  return (minutes / 60).toFixed(1);
}

function fmtHoursFull(minutes: number) {
  return (minutes / 60).toFixed(2);
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthCalendar({
  year,
  month,
  days,
  summary,
  today,
  userScope
}: MonthCalendarProps) {
  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${pad2(month - 1)}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${pad2(month + 1)}`;
  const monthLabel = new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const expectedHoursPerDay = 8;
  const expectedTotal = summary.workdayCount * expectedHoursPerDay * 60; // minutes
  const variance = summary.totalLoggedMinutes - expectedTotal;
  const varianceHours = (variance / 60).toFixed(2);
  const variancePositive = variance >= 0;

  // Build 7-column grid (Mon..Sun). First cell offset.
  // days prop already has blanks injected server-side for the grid.
  const byDate = new Map(days.map((d) => [d.date, d]));

  // Determine first weekday of month (0=Sun..6=Sat → remap to Mon=0..Sun=6)
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const offsetMon = (firstDow + 6) % 7; // Mon-based offset

  const daysInMonth = new Date(year, month, 0).getDate();

  // Build grid cells: blanks + actual days
  const cells: Array<{ date: string | null; data: DayData | null }> = [];
  for (let i = 0; i < offsetMon; i++) cells.push({ date: null, data: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad2(month)}-${pad2(d)}`;
    cells.push({ date: dateStr, data: byDate.get(dateStr) ?? null });
  }

  // Pad to full 6-row grid
  while (cells.length % 7 !== 0) cells.push({ date: null, data: null });

  return (
    <div className="space-y-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Link
          href={toRoute(`/dashboard/calendar?month=${prevMonth}${userScope === "all" ? "&scope=all" : ""}`)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent/10 hover:text-foreground transition"
        >
          ← Prev
        </Link>
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <Link
          href={toRoute(`/dashboard/calendar?month=${nextMonth}${userScope === "all" ? "&scope=all" : ""}`)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent/10 hover:text-foreground transition"
        >
          Next →
        </Link>
      </div>

      {/* Calendar grid */}
      <div className="overflow-auto">
        <div className="grid grid-cols-7 min-w-[560px]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}

          {cells.map((cell, idx) => {
            if (!cell.date) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="min-h-[72px] border-t border-border/40 bg-muted/10"
                />
              );
            }

            const isToday = cell.date === today;
            const isWeekend = cell.data?.isWeekend ?? false;
            const hasHours = (cell.data?.totalMinutes ?? 0) > 0;
            const isPast = cell.date < today;
            const isWorkday = !isWeekend;

            return (
              <div
                key={cell.date}
                className={cn(
                  "min-h-[72px] border-t border-border/40 p-2 text-sm flex flex-col gap-1 transition",
                  isWeekend && "bg-muted/20",
                  isToday && "ring-1 ring-inset ring-primary/60 bg-primary/5",
                  !hasHours && isPast && isWorkday && "bg-destructive/5"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  {parseInt(cell.date.slice(8), 10)}
                </span>
                {hasHours && (
                  <span className="text-sm font-semibold text-foreground leading-none">
                    {fmtHours(cell.data!.totalMinutes)}h
                  </span>
                )}
                {!hasHours && isPast && isWorkday && (
                  <span className="text-[10px] text-destructive/70 leading-none">0h</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Monthly summary</CardTitle>
          <CardDescription>
            {monthLabel} · {userScope === "all" ? "All users" : "Your effort"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile
              label="Logged hours"
              value={`${fmtHoursFull(summary.totalLoggedMinutes)}h`}
            />
            <SummaryTile
              label="Expected hours"
              value={`${fmtHoursFull(expectedTotal)}h`}
              sub={`${summary.workdayCount} workdays × 8h`}
            />
            <SummaryTile
              label="Variance"
              value={`${variancePositive ? "+" : ""}${varianceHours}h`}
              valueClass={variancePositive ? "text-green-500" : "text-destructive"}
            />
            <SummaryTile
              label="Zero-effort workdays"
              value={String(summary.zeroDays)}
              valueClass={summary.zeroDays > 0 ? "text-destructive" : "text-green-500"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  valueClass
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-4 py-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-semibold", valueClass)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
