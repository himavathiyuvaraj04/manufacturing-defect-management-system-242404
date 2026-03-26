"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import type {
  CorrectiveActionCreate,
  CorrectiveActionResponse,
  DefectResponse,
  RcaResponse,
  RcaUpsert,
} from "@/lib/types";

function safeJsonParse(input: string): Record<string, unknown> | null {
  try {
    if (!input.trim()) return null;
    return JSON.parse(input) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function DefectDetailPage({
  params,
}: {
  params: Promise<{ defectId: string }>;
}) {
  const defectId = React.use(params).defectId;

  const [error, setError] = useState<unknown>(null);
  const [defect, setDefect] = useState<DefectResponse | null>(null);

  const [photo, setPhoto] = useState<File | null>(null);

  const [rca, setRca] = useState<RcaResponse | null>(null);
  const [rcaMethod, setRcaMethod] = useState<"5-Why" | "Fishbone">("5-Why");
  const [fiveWhysText, setFiveWhysText] = useState<string>(
    JSON.stringify(
      { why1: "", why2: "", why3: "", why4: "", why5: "" },
      null,
      2
    )
  );
  const [fishboneText, setFishboneText] = useState<string>(
    JSON.stringify(
      {
        man: [],
        machine: [],
        method: [],
        material: [],
        measurement: [],
        environment: [],
      },
      null,
      2
    )
  );
  const [rcaConclusion, setRcaConclusion] = useState("");

  const [actions, setActions] = useState<CorrectiveActionResponse[]>([]);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionDesc, setNewActionDesc] = useState("");
  const [newActionDue, setNewActionDue] = useState("");
  const [newActionStatus, setNewActionStatus] = useState("Open");

  const rcaPayload: RcaUpsert = useMemo(() => {
    if (rcaMethod === "5-Why") {
      return {
        method: "5-Why",
        five_whys: safeJsonParse(fiveWhysText),
        fishbone: null,
        conclusion: rcaConclusion || null,
      };
    }
    return {
      method: "Fishbone",
      five_whys: null,
      fishbone: safeJsonParse(fishboneText),
      conclusion: rcaConclusion || null,
    };
  }, [rcaMethod, fiveWhysText, fishboneText, rcaConclusion]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const [d, r, a] = await Promise.all([
          api.getDefect(defectId),
          api.getRca(defectId),
          api.listActions({ defect_id: defectId, limit: "200", offset: "0" }),
        ]);
        if (cancelled) return;
        setDefect(d as DefectResponse);

        const rr = r as RcaResponse | null;
        setRca(rr);
        if (rr?.method === "Fishbone") setRcaMethod("Fishbone");
        if (rr?.five_whys) setFiveWhysText(JSON.stringify(rr.five_whys, null, 2));
        if (rr?.fishbone) setFishboneText(JSON.stringify(rr.fishbone, null, 2));
        if (rr?.conclusion) setRcaConclusion(rr.conclusion);

        setActions(a as CorrectiveActionResponse[]);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [defectId]);

  return (
    <AppShell>
      <div className="py-6 grid gap-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="h1">Defect Detail</h1>
            <p className="subtle mt-1">
              Defect id: <span className="font-mono">{defectId}</span>
            </p>
          </div>
          <Link href="/defects" className="btn btn-outline">
            Back to list
          </Link>
        </div>

        <ErrorBanner error={error} />

        <div className="grid-2">
          <Card
            title={`Defect ${defect?.defect_number || ""}`}
            subtitle="Core defect data"
          >
            {defect ? (
              <div className="grid gap-2">
                <div className="grid-2">
                  <div>
                    <div className="subtle">Occurred</div>
                    <div className="font-semibold">
                      {new Date(defect.occurred_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="subtle">Quantity affected</div>
                    <div className="font-semibold">{defect.quantity_affected}</div>
                  </div>
                </div>
                <div className="grid-2">
                  <div>
                    <div className="subtle">Severity</div>
                    <div>
                      <StatusBadge status={defect.severity} />
                    </div>
                  </div>
                  <div>
                    <div className="subtle">Status</div>
                    <div>
                      <StatusBadge status={defect.status} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="subtle">Part number</div>
                  <div className="font-semibold">{defect.part_number || "—"}</div>
                </div>

                <div>
                  <div className="subtle">Description</div>
                  <div className="font-semibold">{defect.description || "—"}</div>
                </div>

                <div className="grid gap-2">
                  <div className="subtle">Photo</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge">
                      {defect.photo_path ? "On file" : "None"}
                    </span>

                    <input
                      className="input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    />
                    <button
                      className="btn btn-secondary"
                      disabled={!photo}
                      onClick={async () => {
                        try {
                          if (!photo) return;
                          setError(null);
                          await api.uploadDefectPhoto(defectId, photo);
                          const d = (await api.getDefect(defectId)) as DefectResponse;
                          setDefect(d);
                          setPhoto(null);
                        } catch (e) {
                          setError(e);
                        }
                      }}
                    >
                      Upload/Replace photo
                    </button>
                  </div>
                  <div className="subtle">
                    Note: serving the actual image file depends on backend static file
                    configuration; this UI confirms whether a path exists.
                  </div>
                </div>
              </div>
            ) : (
              <div className="subtle">Loading…</div>
            )}
          </Card>

          <Card
            title="Root Cause Analysis (RCA)"
            subtitle="Capture mandatory RCA using 5-Why or Fishbone"
            actions={
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    setError(null);
                    const saved = await api.upsertRca(defectId, rcaPayload as unknown as Record<string, unknown>);
                    setRca(saved as RcaResponse);
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                Save RCA
              </button>
            }
          >
            <div className="grid gap-3">
              <FieldRow label="Method">
                <select
                  className="select"
                  value={rcaMethod}
                  onChange={(e) => setRcaMethod(e.target.value as "5-Why" | "Fishbone")}
                >
                  <option value="5-Why">5-Why</option>
                  <option value="Fishbone">Fishbone</option>
                </select>
              </FieldRow>

              {rcaMethod === "5-Why" ? (
                <FieldRow
                  label="5-Why JSON"
                  hint="Edit the JSON structure; backend accepts arbitrary object."
                >
                  <textarea
                    className="textarea"
                    value={fiveWhysText}
                    onChange={(e) => setFiveWhysText(e.target.value)}
                  />
                </FieldRow>
              ) : (
                <FieldRow
                  label="Fishbone JSON"
                  hint="Suggested categories: man/machine/method/material/measurement/environment"
                >
                  <textarea
                    className="textarea"
                    value={fishboneText}
                    onChange={(e) => setFishboneText(e.target.value)}
                  />
                </FieldRow>
              )}

              <FieldRow label="Conclusion (optional)">
                <textarea
                  className="textarea"
                  value={rcaConclusion}
                  onChange={(e) => setRcaConclusion(e.target.value)}
                  placeholder="Summarize the likely root cause and evidence."
                />
              </FieldRow>

              <div className="subtle">
                Current RCA status:{" "}
                <span className="badge">{rca ? `Saved (${rca.method})` : "Not saved"}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Corrective Actions" subtitle="Assign and track actions for this defect">
          <div className="grid gap-4">
            <div className="surface p-4">
              <div className="h2">Create action</div>
              <div className="grid gap-3 mt-3">
                <FieldRow label="Title">
                  <input
                    className="input"
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    placeholder="e.g., Update work instruction / retrain operator"
                  />
                </FieldRow>
                <FieldRow label="Description (optional)">
                  <textarea
                    className="textarea"
                    value={newActionDesc}
                    onChange={(e) => setNewActionDesc(e.target.value)}
                  />
                </FieldRow>
                <div className="grid-2">
                  <FieldRow label="Due date (optional)">
                    <input
                      className="input"
                      type="date"
                      value={newActionDue}
                      onChange={(e) => setNewActionDue(e.target.value)}
                    />
                  </FieldRow>
                  <FieldRow label="Initial status">
                    <select
                      className="select"
                      value={newActionStatus}
                      onChange={(e) => setNewActionStatus(e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </FieldRow>
                </div>

                <button
                  className="btn btn-primary"
                  disabled={!newActionTitle.trim()}
                  onClick={async () => {
                    try {
                      setError(null);
                      const payload: CorrectiveActionCreate = {
                        defect_id: defectId,
                        title: newActionTitle.trim(),
                        description: newActionDesc.trim() || null,
                        due_date: newActionDue ? new Date(`${newActionDue}T00:00:00Z`).toISOString() : null,
                        status: newActionStatus,
                      };
                      const created = (await api.createAction(payload as unknown as Record<string, unknown>)) as CorrectiveActionResponse;
                      setActions((prev) => [created, ...prev]);
                      setNewActionTitle("");
                      setNewActionDesc("");
                      setNewActionDue("");
                      setNewActionStatus("Open");
                    } catch (e) {
                      setError(e);
                    }
                  }}
                >
                  Add action
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="font-semibold">{a.title}</div>
                        <div className="subtle">{a.description || ""}</div>
                      </td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}</td>
                      <td>{new Date(a.updated_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-outline"
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
                              setActions((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
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
                  {actions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="subtle">
                        No corrective actions yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
