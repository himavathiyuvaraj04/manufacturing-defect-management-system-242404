"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type Option = { id: string; code?: string; name?: string };

function asOptions(rows: Array<Record<string, unknown>>): Option[] {
  return rows
    .map((r) => ({
      id: String(r.id),
      code: (r.code as string | undefined) || undefined,
      name: (r.name as string | undefined) || undefined,
    }))
    .filter((x) => x.id && x.id !== "undefined");
}

export default function NewDefectPage() {
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);

  const [defectTypes, setDefectTypes] = useState<Option[]>([]);
  const [lines, setLines] = useState<Option[]>([]);
  const [shifts, setShifts] = useState<Option[]>([]);

  const [occurredAtDate, setOccurredAtDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [occurredAtTime, setOccurredAtTime] = useState(() =>
    format(new Date(), "HH:mm")
  );

  const occurredAtIso = useMemo(() => {
    const iso = new Date(`${occurredAtDate}T${occurredAtTime}:00`).toISOString();
    return iso;
  }, [occurredAtDate, occurredAtTime]);

  const [partNumber, setPartNumber] = useState("");
  const [description, setDescription] = useState("");
  const [defectTypeId, setDefectTypeId] = useState<string>("");
  const [productionLineId, setProductionLineId] = useState<string>("");
  const [shiftId, setShiftId] = useState<string>("");
  const [quantityAffected, setQuantityAffected] = useState<number>(0);
  const [severityManual, setSeverityManual] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const [dt, pl, sh] = await Promise.all([
          api.listDefectTypes(),
          api.listProductionLines(),
          api.listShifts(),
        ]);
        if (cancelled) return;
        setDefectTypes(asOptions(dt));
        setLines(asOptions(pl));
        setShifts(asOptions(sh));
      } catch (e) {
        if (!cancelled) setError(e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="py-6 grid gap-4" style={{ maxWidth: 820 }}>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="h1">Log Defect</h1>
            <p className="subtle mt-1">
              Create a defect record at the point of occurrence (optional photo
              upload).
            </p>
          </div>
          <button className="btn btn-outline" onClick={() => router.push("/defects")}>
            View Defects
          </button>
        </div>

        <ErrorBanner error={error} />

        <Card
          title="Defect Entry"
          subtitle="Fields map to backend /defects multipart/form-data"
        >
          <div className="grid gap-3">
            <div className="grid-2">
              <FieldRow label="Occurred date">
                <input
                  className="input"
                  type="date"
                  value={occurredAtDate}
                  onChange={(e) => setOccurredAtDate(e.target.value)}
                />
              </FieldRow>
              <FieldRow label="Occurred time">
                <input
                  className="input"
                  type="time"
                  value={occurredAtTime}
                  onChange={(e) => setOccurredAtTime(e.target.value)}
                />
              </FieldRow>
            </div>

            <div className="grid-2">
              <FieldRow label="Part number (optional)">
                <input
                  className="input"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                />
              </FieldRow>
              <FieldRow label="Quantity affected">
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={quantityAffected}
                  onChange={(e) => setQuantityAffected(Number(e.target.value))}
                />
              </FieldRow>
            </div>

            <FieldRow label="Description (optional)">
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Where was it found?"
              />
            </FieldRow>

            <div className="grid-3">
              <FieldRow label="Defect type">
                <select
                  className="select"
                  value={defectTypeId}
                  onChange={(e) => setDefectTypeId(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {defectTypes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code ? `${d.code} — ${d.name || ""}` : d.name || d.id}
                    </option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Production line">
                <select
                  className="select"
                  value={productionLineId}
                  onChange={(e) => setProductionLineId(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code ? `${l.code} — ${l.name || ""}` : l.name || l.id}
                    </option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Shift">
                <select
                  className="select"
                  value={shiftId}
                  onChange={(e) => setShiftId(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `${s.code} — ${s.name || ""}` : s.name || s.id}
                    </option>
                  ))}
                </select>
              </FieldRow>
            </div>

            <div className="grid-2">
              <FieldRow
                label="Severity manual (optional)"
                hint="Overrides rule/default severity. Values used by backend: Critical/Major/Minor"
              >
                <select
                  className="select"
                  value={severityManual}
                  onChange={(e) => setSeverityManual(e.target.value)}
                >
                  <option value="">— Use rules/default —</option>
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
              </FieldRow>

              <FieldRow label="Tags (optional)" hint="Comma-separated tags">
                <input
                  className="input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., weld, cosmetic, rework"
                />
              </FieldRow>
            </div>

            <FieldRow label="Photo (optional)">
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </FieldRow>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={async () => {
                  try {
                    setSaving(true);
                    setError(null);
                    const form = new FormData();
                    form.append("occurred_at", occurredAtIso);
                    if (partNumber.trim()) form.append("part_number", partNumber.trim());
                    if (description.trim()) form.append("description", description.trim());
                    if (defectTypeId) form.append("defect_type_id", defectTypeId);
                    if (productionLineId) form.append("production_line_id", productionLineId);
                    if (shiftId) form.append("shift_id", shiftId);
                    form.append("quantity_affected", String(quantityAffected || 0));
                    if (severityManual) form.append("severity_manual", severityManual);
                    if (tags.trim()) form.append("tags", tags.trim());
                    if (photo) form.append("photo", photo);

                    const created = await api.createDefect(form);
                    const defectId = (created as { id: string }).id;
                    router.push(`/defects/${defectId}`);
                  } catch (e) {
                    setError(e);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving…" : "Create defect"}
              </button>

              <button className="btn btn-outline" onClick={() => router.push("/")}>
                Cancel
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
