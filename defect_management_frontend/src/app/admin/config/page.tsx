"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";
import { SetupGuide } from "@/components/SetupGuide";

type Row = Record<string, unknown>;

function asStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export default function AdminConfigPage() {
  const [error, setError] = useState<unknown>(null);

  const [defectTypes, setDefectTypes] = useState<Row[]>([]);
  const [lines, setLines] = useState<Row[]>([]);
  const [shifts, setShifts] = useState<Row[]>([]);

  const [dtCode, setDtCode] = useState("");
  const [dtName, setDtName] = useState("");
  const [dtDefaultSeverity, setDtDefaultSeverity] = useState("Minor");

  const [lineCode, setLineCode] = useState("");
  const [lineName, setLineName] = useState("");

  const [shiftCode, setShiftCode] = useState("");
  const [shiftName, setShiftName] = useState("");

  const readyToLogDefects = useMemo(() => {
    return defectTypes.length > 0 && lines.length > 0 && shifts.length > 0;
  }, [defectTypes.length, lines.length, shifts.length]);

  async function refresh() {
    const [dt, pl, sh] = await Promise.all([
      api.listDefectTypes(),
      api.listProductionLines(),
      api.listShifts(),
    ]);
    setDefectTypes(dt);
    setLines(pl);
    setShifts(sh);
  }

  useEffect(() => {
    refresh().catch(setError);
  }, []);

  async function quickSeed() {
    /**
     * Seed a minimal “works end-to-end” dataset.
     * - We intentionally ignore conflicts/duplicates; backend will usually 400 or 409.
     * - We keep it small so users can edit/remove later from the admin UI or DB.
     */
    setError(null);
    const tasks: Array<Promise<unknown>> = [
      api.createProductionLine("LINE-1", "Line 1"),
      api.createShift("DAY", "Day"),
      api.createShift("NIGHT", "Night"),
      api.createDefectType("WELD", "Weld Defect", "Major"),
      api.createDefectType("COSM", "Cosmetic", "Minor"),
    ];

    const results = await Promise.allSettled(tasks);
    const rejected = results.find((r) => r.status === "rejected");
    if (rejected && rejected.status === "rejected") {
      // Don’t fail entirely; show first error but still refresh.
      setError(rejected.reason);
    }
    await refresh();
  }

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

        {!readyToLogDefects ? (
          <SetupGuide
            title="First-run setup required"
            description="To log defects reliably on a fresh database, configure at least 1 defect type, 1 production line, and 1 shift."
            steps={[
              {
                label: "Add at least one production line",
                hint: "Used on defect entry and dashboard filtering",
              },
              {
                label: "Add at least one shift",
                hint: "Used on defect entry and reporting",
              },
              {
                label: "Add at least one defect type",
                hint: "Required for Pareto and classification",
              },
              {
                label: "Log a defect",
                href: "/defects/new",
                hint: "Then open the defect to add RCA and actions",
              },
              {
                label: "Export CSV/PDF",
                href: "/export",
                hint: "Validate end-to-end reporting",
              },
            ]}
            actions={
              <button className="btn btn-primary" onClick={quickSeed}>
                Quick seed sample config
              </button>
            }
          />
        ) : null}

        <div className="grid-2">
          <Card title="Defect Types" subtitle="Create and list defect types">
            <div className="grid gap-3">
              <div className="grid-3">
                <FieldRow label="Code">
                  <input
                    className="input"
                    value={dtCode}
                    onChange={(e) => setDtCode(e.target.value)}
                    placeholder="e.g., WELD"
                  />
                </FieldRow>
                <FieldRow label="Name">
                  <input
                    className="input"
                    value={dtName}
                    onChange={(e) => setDtName(e.target.value)}
                    placeholder="e.g., Weld Defect"
                  />
                </FieldRow>
                <FieldRow label="Default severity">
                  <select
                    className="select"
                    value={dtDefaultSeverity}
                    onChange={(e) => setDtDefaultSeverity(e.target.value)}
                  >
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
                    await api.createDefectType(
                      dtCode.trim(),
                      dtName.trim(),
                      dtDefaultSeverity
                    );
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
                      <tr key={asStr(r.id || idx)}>
                        <td className="font-mono">{asStr(r.code)}</td>
                        <td>{asStr(r.name)}</td>
                        <td>{asStr(r.default_severity)}</td>
                      </tr>
                    ))}
                    {defectTypes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="subtle">
                          No defect types yet. Add one (or use “Quick seed”).
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card
            title="Production Lines"
            subtitle="Create and list production lines"
          >
            <div className="grid gap-3">
              <div className="grid-2">
                <FieldRow label="Code">
                  <input
                    className="input"
                    value={lineCode}
                    onChange={(e) => setLineCode(e.target.value)}
                    placeholder="e.g., LINE-1"
                  />
                </FieldRow>
                <FieldRow label="Name (optional)">
                  <input
                    className="input"
                    value={lineName}
                    onChange={(e) => setLineName(e.target.value)}
                    placeholder="e.g., Main Assembly"
                  />
                </FieldRow>
              </div>

              <button
                className="btn btn-primary"
                disabled={!lineCode.trim()}
                onClick={async () => {
                  try {
                    setError(null);
                    await api.createProductionLine(
                      lineCode.trim(),
                      lineName.trim() || undefined
                    );
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
                      <tr key={asStr(r.id || idx)}>
                        <td className="font-mono">{asStr(r.code)}</td>
                        <td>{asStr(r.name)}</td>
                      </tr>
                    ))}
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="subtle">
                          No production lines yet. Add one (or use “Quick seed”).
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Shifts" subtitle="Create and list shifts (used in defect entry)">
          <div className="grid gap-3">
            <div className="grid-2">
              <FieldRow label="Code">
                <input
                  className="input"
                  value={shiftCode}
                  onChange={(e) => setShiftCode(e.target.value)}
                  placeholder="e.g., DAY"
                />
              </FieldRow>
              <FieldRow label="Name (optional)">
                <input
                  className="input"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="e.g., Day shift"
                />
              </FieldRow>
            </div>

            <button
              className="btn btn-primary"
              disabled={!shiftCode.trim()}
              onClick={async () => {
                try {
                  setError(null);
                  await api.createShift(
                    shiftCode.trim(),
                    shiftName.trim() || undefined
                  );
                  setShiftCode("");
                  setShiftName("");
                  await refresh();
                } catch (e) {
                  setError(e);
                }
              }}
            >
              Add shift
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
                  {shifts.map((r, idx) => (
                    <tr key={asStr(r.id || idx)}>
                      <td className="font-mono">{asStr(r.code)}</td>
                      <td>{asStr(r.name)}</td>
                    </tr>
                  ))}
                  {shifts.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="subtle">
                        No shifts yet. Add at least one (or use “Quick seed”).
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="subtle">
              Tip: common shift codes are DAY, SWING, NIGHT.
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
