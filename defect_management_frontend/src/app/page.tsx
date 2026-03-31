"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";
import type {
  DashboardOverdueResponse,
  ParetoItem,
  TrendPoint,
} from "@/lib/types";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SetupGuide } from "@/components/SetupGuide";
import { getToken } from "@/lib/auth";

function iso(dt: Date) {
  return dt.toISOString();
}

function isUnauthorized(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status === "number") return status === 401 || status === 403;
  const msg = (err as { message?: string })?.message || "";
  return /401|403|unauthorized|forbidden/i.test(msg);
}

export default function DashboardPage() {
  const [error, setError] = useState<unknown>(null);
  const [overdue, setOverdue] = useState<DashboardOverdueResponse | null>(null);
  const [pareto, setPareto] = useState<ParetoItem[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [configHint, setConfigHint] = useState<{
    defectTypes: number;
    lines: number;
    shifts: number;
  } | null>(null);

  const token = getToken();

  const [start, setStart] = useState(() =>
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [end, setEnd] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  const startIso = useMemo(() => {
    const [y, m, d] = start.split("-").map(Number);
    return iso(startOfDay(new Date(y, m - 1, d)));
  }, [start]);

  const endIso = useMemo(() => {
    const [y, m, d] = end.split("-").map(Number);
    return iso(endOfDay(new Date(y, m - 1, d)));
  }, [end]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);

        // Lightweight "is the system configured?" check:
        // this enables a better first-run UX when charts are empty.
        const [dt, pl, sh] = await Promise.all([
          api.listDefectTypes(),
          api.listProductionLines(),
          api.listShifts(),
        ]);
        if (!cancelled) {
          setConfigHint({
            defectTypes: (dt as Array<unknown>).length,
            lines: (pl as Array<unknown>).length,
            shifts: (sh as Array<unknown>).length,
          });
        }

        const [o, p, t] = await Promise.all([
          api.dashboardOverdue(),
          api.dashboardPareto({ start: startIso, end: endIso, limit: "10" }),
          api.dashboardTrends({ start: startIso, end: endIso, period }),
        ]);

        if (cancelled) return;
        setOverdue(o as DashboardOverdueResponse);
        setPareto(p as ParetoItem[]);
        setTrends(t as TrendPoint[]);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startIso, endIso, period]);

  const missingConfig =
    !!configHint &&
    (configHint.defectTypes === 0 ||
      configHint.lines === 0 ||
      configHint.shifts === 0);

  return (
    <AppShell>
      <div className="py-6 grid gap-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="h1">Dashboard</h1>
            <p className="subtle mt-1">
              Overdue corrective actions, Pareto by defect type, and trends over
              time.
            </p>
          </div>

          <div className="surface p-3 flex items-end gap-3 flex-wrap">
            <div style={{ minWidth: 160 }}>
              <FieldRow label="Start">
                <input
                  className="input"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </FieldRow>
            </div>
            <div style={{ minWidth: 160 }}>
              <FieldRow label="End">
                <input
                  className="input"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </FieldRow>
            </div>
            <div style={{ minWidth: 160 }}>
              <FieldRow label="Period">
                <select
                  className="select"
                  value={period}
                  onChange={(e) =>
                    setPeriod(e.target.value as "day" | "week" | "month")
                  }
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </FieldRow>
            </div>
          </div>
        </div>

        {isUnauthorized(error) ? (
          <SetupGuide
            title="Login required"
            description="Your session is missing/expired, or your account doesn’t have access to one or more endpoints."
            steps={[
              {
                label: "Login",
                href: "/login",
                hint: "If this is a fresh database, create the first account via Register",
              },
              {
                label: "Register first account (bootstrap admin)",
                href: "/register",
                hint: "The backend promotes the first created user to admin automatically",
              },
            ]}
            actions={
              <div className="flex items-center gap-2">
                <Link className="btn btn-primary" href="/login">
                  Go to login
                </Link>
                <Link className="btn btn-outline" href="/register">
                  Register
                </Link>
              </div>
            }
          />
        ) : null}

        <ErrorBanner error={error} />

        {!token ? (
          <SetupGuide
            title="Get started"
            description="This app uses JWT login. On a fresh database, you must create the first account."
            steps={[
              {
                label: "Register the first account",
                href: "/register",
                hint: "First user becomes admin automatically (bootstrap)",
              },
              { label: "Login", href: "/login" },
              {
                label: "Configure defect types, production lines, and shifts",
                href: "/admin/config",
              },
              { label: "Log a defect", href: "/defects/new" },
              {
                label: "Open the defect to add RCA and corrective actions",
                href: "/defects",
              },
              { label: "Export reports", href: "/export" },
            ]}
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                <Link className="btn btn-primary" href="/register">
                  Register
                </Link>
                <Link className="btn btn-outline" href="/login">
                  Login
                </Link>
              </div>
            }
          />
        ) : null}

        {missingConfig ? (
          <SetupGuide
            title="Configuration is incomplete"
            description={`Detected: defect types=${configHint?.defectTypes ?? 0}, lines=${configHint?.lines ?? 0}, shifts=${configHint?.shifts ?? 0}. Add at least 1 of each to make defect logging and charts meaningful.`}
            steps={[
              { label: "Open Admin → Config", href: "/admin/config" },
              { label: "Add a defect type, production line, and shift" },
              { label: "Log your first defect", href: "/defects/new" },
            ]}
            actions={
              <Link className="btn btn-primary" href="/admin/config">
                Complete setup
              </Link>
            }
          />
        ) : null}

        <div className="grid-3">
          <Card title="Overdue Actions" subtitle="Auto-updated based on due date">
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-extrabold">
                {overdue?.overdue_actions ?? "—"}
              </div>
              <Link href="/actions" className="btn btn-outline">
                View Actions
              </Link>
            </div>
            <div className="subtle mt-2">
              Breakdown by assignee is available in Actions view.
            </div>
          </Card>

          <Card
            title="Pareto (Top Defect Types)"
            subtitle="Counts by defect type in selected range"
          >
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={pareto}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="defect_type_code" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {pareto.length === 0 ? (
              <div className="subtle mt-2">
                No Pareto data in this range yet.{" "}
                <Link className="underline" href="/defects/new">
                  Log a defect
                </Link>{" "}
                and ensure defect types exist in{" "}
                <Link className="underline" href="/admin/config">
                  Admin → Config
                </Link>
                .
              </div>
            ) : (
              <div className="subtle mt-2">
                Use Admin → Config to add defect types.
              </div>
            )}
          </Card>

          <Card
            title="Trend (Counts + Severity)"
            subtitle="Counts grouped by period (critical/major/minor)"
          >
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#111827" />
                  <Line type="monotone" dataKey="critical" stroke="#EF4444" />
                  <Line type="monotone" dataKey="major" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="minor" stroke="#06b6d4" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {trends.length === 0 ? (
              <div className="subtle mt-2">
                No trend data in this range yet. Try expanding the date range or{" "}
                <Link className="underline" href="/defects/new">
                  log a defect
                </Link>
                .
              </div>
            ) : null}
          </Card>
        </div>

        <div className="grid-2">
          <Card
            title="Quick Actions"
            subtitle="Common workflow entry points"
            actions={
              <Link className="btn btn-primary" href="/defects/new">
                Log Defect
              </Link>
            }
          >
            <ul className="grid gap-2 subtle">
              <li>
                1) Log defect → 2) Capture RCA (5-Why/Fishbone) → 3) Assign
                corrective actions
              </li>
              <li>
                <Link className="underline" href="/export">
                  Export
                </Link>{" "}
                to download PDF/CSV reports for audits.
              </li>
              <li>
                <Link className="underline" href="/audit">
                  Audit
                </Link>{" "}
                to review entity changes (manager/admin).
              </li>
            </ul>
          </Card>

          <Card title="Recommended first-run path" subtitle="Fresh database setup">
            <ul className="grid gap-2 subtle">
              <li>
                Create first user:{" "}
                <Link className="underline" href="/register">
                  Register
                </Link>{" "}
                (bootstrap admin) →{" "}
                <Link className="underline" href="/login">
                  Login
                </Link>
              </li>
              <li>
                Configure master data in{" "}
                <Link className="underline" href="/admin/config">
                  Admin → Config
                </Link>{" "}
                (defect types, lines, shifts)
              </li>
              <li>
                Validate end-to-end:{" "}
                <Link className="underline" href="/defects/new">
                  Create defect
                </Link>{" "}
                → open defect → save RCA → add action → revisit dashboard →{" "}
                <Link className="underline" href="/export">
                  export
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
