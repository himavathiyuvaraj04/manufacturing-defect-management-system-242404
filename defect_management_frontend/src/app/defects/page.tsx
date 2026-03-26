"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import type { DefectResponse } from "@/lib/types";
import Link from "next/link";

export default function DefectsListPage() {
  const [error, setError] = useState<unknown>(null);
  const [rows, setRows] = useState<DefectResponse[]>([]);
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const limit = 100;

  const params = useMemo(
    () => ({
      q: q || undefined,
      severity: severity || undefined,
      status: status || undefined,
      limit: String(limit),
      offset: "0",
    }),
    [q, severity, status, limit]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const data = (await api.listDefects(params)) as DefectResponse[];
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <AppShell>
      <div className="py-6 grid gap-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="h1">Defects</h1>
            <p className="subtle mt-1">Filter and review defect records.</p>
          </div>
          <Link href="/defects/new" className="btn btn-primary">
            Log Defect
          </Link>
        </div>

        <ErrorBanner error={error} />

        <Card title="Filters" subtitle="Search by defect number, part number, or description">
          <div className="grid-3">
            <FieldRow label="Search">
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} />
            </FieldRow>
            <FieldRow label="Severity">
              <select className="select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">All</option>
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
              </select>
            </FieldRow>
            <FieldRow label="Status">
              <input className="input" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="e.g., Open/Closed" />
            </FieldRow>
          </div>
          <div className="subtle mt-2">Showing up to {limit} records.</div>
        </Card>

        <Card title="Results" subtitle={`${rows.length} defect(s)`}>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Defect #</th>
                  <th>Occurred</th>
                  <th>Part</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Qty</th>
                  <th>Photo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className="font-mono">{d.defect_number}</td>
                    <td>{new Date(d.occurred_at).toLocaleString()}</td>
                    <td>{d.part_number || "—"}</td>
                    <td>
                      <StatusBadge status={d.severity} />
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>{d.quantity_affected}</td>
                    <td>{d.photo_path ? "Yes" : "—"}</td>
                    <td>
                      <Link className="btn btn-outline" href={`/defects/${d.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="subtle">
                      No defects found. Try adjusting filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
