"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";

type AuditRow = Record<string, unknown>;

export default function AuditPage() {
  const [error, setError] = useState<unknown>(null);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actorUserId, setActorUserId] = useState("");

  const params = useMemo(
    () => ({
      entity_type: entityType || undefined,
      entity_id: entityId || undefined,
      actor_user_id: actorUserId || undefined,
      limit: "200",
      offset: "0",
    }),
    [entityType, entityId, actorUserId]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const data = (await api.listAudit(params)) as AuditRow[];
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
        <div>
          <h1 className="h1">Audit Log</h1>
          <p className="subtle mt-1">
            Compliance trail of entity changes (typically manager/admin).
          </p>
        </div>

        <ErrorBanner error={error} />

        <Card title="Filters" subtitle="Optional server-side filters">
          <div className="grid-3">
            <FieldRow label="Entity type">
              <input
                className="input"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                placeholder="Defect / CorrectiveAction / RCA ..."
              />
            </FieldRow>
            <FieldRow label="Entity id">
              <input
                className="input"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="UUID"
              />
            </FieldRow>
            <FieldRow label="Actor user id">
              <input
                className="input"
                value={actorUserId}
                onChange={(e) => setActorUserId(e.target.value)}
                placeholder="UUID"
              />
            </FieldRow>
          </div>
        </Card>

        <Card title="Results" subtitle={`${rows.length} entry(ies)`}>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Action</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={String(r.id || idx)}>
                    <td>{String(r.created_at || r.at || "—")}</td>
                    <td className="font-mono">{String(r.actor_user_id || "—")}</td>
                    <td>
                      <div className="font-semibold">{String(r.entity_type || "—")}</div>
                      <div className="subtle font-mono">{String(r.entity_id || "—")}</div>
                    </td>
                    <td>{String(r.action || r.event || "—")}</td>
                    <td className="subtle">
                      {String(r.summary || r.message || "")}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="subtle">
                      No audit entries found.
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
