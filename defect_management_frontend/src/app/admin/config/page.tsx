"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";

type Row = Record<string, unknown>;

export default function AdminConfigPage() {
  const [error, setError] = useState<unknown>(null);
  const [defectTypes, setDefectTypes] = useState<Row[]>([]);
  const [lines, setLines] = useState<Row[]>([]);

  const [dtCode, setDtCode] = useState("");
  const [dtName, setDtName] = useState("");
  const [dtDefaultSeverity, setDtDefaultSeverity] = useState("Minor");

  const [lineCode, setLineCode] = useState("");
  const [lineName, setLineName] = useState("");

  async function refresh() {
    const [dt, pl] = await Promise.all([
      api.listDefectTypes(),
      api.listProductionLines(),
    ]);
    setDefectTypes(dt);
    setLines(pl);
  }

  useEffect(() => {
    refresh().catch(setError);
  }, []);

  return (
    <AppShell>
      <div className="py-6 grid gap-4">
        <div>
          <h1 className="h1">Admin / Config</h1>
          <p className="subtle mt-1">
            Master data used in defect entry and dashboard filters.
          </p>
        </div>

        <ErrorBanner error={error} />

        <div className="grid-2">
          <Card title="Defect Types" subtitle="Create and list defect types">
            <div className="grid gap-3">
              <div className="grid-3">
                <FieldRow label="Code">
                  <input className="input" value={dtCode} onChange={(e) => setDtCode(e.target.value)} />
                </FieldRow>
                <FieldRow label="Name">
                  <input className="input" value={dtName} onChange={(e) => setDtName(e.target.value)} />
                </FieldRow>
                <FieldRow label="Default severity">
                  <select className="select" value={dtDefaultSeverity} onChange={(e) => setDtDefaultSeverity(e.target.value)}>
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                  </select>
                </FieldRow>
              </div>
              <button
                className="btn btn-primary"
                disabled={!dtCode.trim() || !dtName.trim()}
                onClick={async () => {
                  try {
                    setError(null);
                    await api.createDefectType(dtCode.trim(), dtName.trim(), dtDefaultSeverity);
                    setDtCode("");
                    setDtName("");
                    await refresh();
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                Add defect type
              </button>

              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Default severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defectTypes.map((r, idx) => (
                      <tr key={String(r.id || idx)}>
                        <td className="font-mono">{String(r.code || "")}</td>
                        <td>{String(r.name || "")}</td>
                        <td>{String(r.default_severity || "")}</td>
                      </tr>
                    ))}
                    {defectTypes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="subtle">
                          No defect types.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card title="Production Lines" subtitle="Create and list production lines">
            <div className="grid gap-3">
              <div className="grid-2">
                <FieldRow label="Code">
                  <input className="input" value={lineCode} onChange={(e) => setLineCode(e.target.value)} />
                </FieldRow>
                <FieldRow label="Name (optional)">
                  <input className="input" value={lineName} onChange={(e) => setLineName(e.target.value)} />
                </FieldRow>
              </div>
              <button
                className="btn btn-primary"
                disabled={!lineCode.trim()}
                onClick={async () => {
                  try {
                    setError(null);
                    await api.createProductionLine(lineCode.trim(), lineName.trim() || undefined);
                    setLineCode("");
                    setLineName("");
                    await refresh();
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                Add production line
              </button>

              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((r, idx) => (
                      <tr key={String(r.id || idx)}>
                        <td className="font-mono">{String(r.code || "")}</td>
                        <td>{String(r.name || "")}</td>
                      </tr>
                    ))}
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="subtle">
                          No production lines.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
