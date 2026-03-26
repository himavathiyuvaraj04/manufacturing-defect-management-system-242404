"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";
import type { DashboardOverdueResponse, ParetoItem, TrendPoint } from "@/lib/types";
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

function iso(dt: Date) {
  return dt.toISOString();
}

export default function DashboardPage() {
  const [error, setError] = useState<unknown>(null);
  const [overdue, setOverdue] = useState<DashboardOverdueResponse | null>(null);
  const [pareto, setPareto] = useState<ParetoItem[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);

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

        <ErrorBanner error={error} />

        <div className="grid-3">
          <Card
            title="Overdue Actions"
            subtitle="Auto-updated based on due date"
          >
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
            <div className="subtle mt-2">
              Use Admin → Config to add defect types.
            </div>
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
                1) Log defect (optional photo) → 2) Capture RCA (5-Why/Fishbone)
                → 3) Assign corrective actions
              </li>
              <li>Use Export to download PDF/CSV reports for audits.</li>
              <li>Use Audit view to review entity changes.</li>
            </ul>
          </Card>

          <Card
            title="Compliance Notes"
            subtitle="Workflow enforcement guidance"
          >
            <ul className="grid gap-2 subtle">
              <li>
                Defects can be created with or without photo; you can also upload
                a photo later.
              </li>
              <li>
                RCA capture is supported as an upsert; method must be “5-Why” or
                “Fishbone”.
              </li>
              <li>
                Corrective actions support status updates; “Overdue” is computed
                server-side.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
