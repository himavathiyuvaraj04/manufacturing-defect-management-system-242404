"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import type { CorrectiveActionResponse } from "@/lib/types";
import Link from "next/link";

export default function ActionsPage() {
  const [error, setError] = useState<unknown>(null);
  const [rows, setRows] = useState<CorrectiveActionResponse[]>([]);
  const [status, setStatus] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const params = useMemo(
    () => ({
      status: status || undefined,
      overdue_only: overdueOnly ? "true" : "false",
      limit: "200",
      offset: "0",
    }),
    [status, overdueOnly]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const data = (await api.listActions(params)) as CorrectiveActionResponse[];
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
            <h1 className="h1">Corrective Actions</h1>
            <p className="subtle mt-1">
              Track status transitions and overdue actions.
            </p>
          </div>
          <Link href="/" className="btn btn-outline">
            Back to dashboard
          </Link>
        </div>

        <ErrorBanner error={error} />

        <Card title="Filters" subtitle="Use server-side filters">
          <div className="grid-2">
            <FieldRow label="Status">
              <input
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Open/In Progress/Done/Cancelled/Overdue"
              />
            </FieldRow>

            <FieldRow label="Overdue only">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                />
                <span className="subtle">Only show overdue actions</span>
              </label>
            </FieldRow>
          </div>
        </Card>

        <Card title="Results" subtitle={`${rows.length} action(s)`}>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Defect</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="font-semibold">{a.title}</div>
                      <div className="subtle">{a.description || ""}</div>
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      {a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <Link className="btn btn-outline" href={`/defects/${a.defect_id}`}>
                        Open defect
                      </Link>
                    </td>
                    <td>{new Date(a.updated_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          try {
                            setError(null);
                            const next =
                              a.status === "Open"
                                ? "In Progress"
                                : a.status === "In Progress"
                                ? "Done"
                                : "Open";
                            const updated = (await api.updateAction(a.id, { status: next })) as CorrectiveActionResponse;
                            setRows((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
                          } catch (e) {
                            setError(e);
                          }
                        }}
                      >
                        Cycle status
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="subtle">
                      No actions found.
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
