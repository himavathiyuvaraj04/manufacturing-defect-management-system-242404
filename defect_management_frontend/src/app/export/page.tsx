"use client";

import React, { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { format, subDays } from "date-fns";

async function downloadFile(url: string, filename: string) {
  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Download failed (${res.status}): ${text}`);
  }
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export default function ExportPage() {
  const [error, setError] = useState<unknown>(null);
  const [start, setStart] = useState(() =>
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [end, setEnd] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    if (start) sp.set("start", new Date(`${start}T00:00:00Z`).toISOString());
    if (end) sp.set("end", new Date(`${end}T23:59:59Z`).toISOString());
    return sp.toString() ? `?${sp.toString()}` : "";
  }, [start, end]);

  return (
    <AppShell>
      <div className="py-6 grid gap-4" style={{ maxWidth: 720 }}>
        <h1 className="h1">Export</h1>
        <p className="subtle">
          Export defects for reporting and compliance (CSV/PDF).
        </p>

        <ErrorBanner error={error} />

        <Card title="Date range" subtitle="Used for both CSV and PDF exports">
          <div className="grid-2">
            <FieldRow label="Start">
              <input
                className="input"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </FieldRow>
            <FieldRow label="End">
              <input
                className="input"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </FieldRow>
          </div>
        </Card>

        <Card title="Downloads" subtitle="Uses backend /export endpoints">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  setError(null);
                  await downloadFile(
                    `${API_BASE_URL}/export/defects.csv${qs}`,
                    `defects_${start}_${end}.csv`
                  );
                } catch (e) {
                  setError(e);
                }
              }}
            >
              Download CSV
            </button>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  setError(null);
                  await downloadFile(
                    `${API_BASE_URL}/export/defects.pdf${qs}`,
                    `defects_${start}_${end}.pdf`
                  );
                } catch (e) {
                  setError(e);
                }
              }}
            >
              Download PDF
            </button>
          </div>

          <div className="subtle mt-2">
            If downloads fail, confirm you are logged in and the backend is reachable
            at {API_BASE_URL}.
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
