"use client";

import React from "react";

// PUBLIC_INTERFACE
export function Card({
  title,
  subtitle,
  actions,
  children,
}: {
  /** Card title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional header actions */
  actions?: React.ReactNode;
  /** Card body content */
  children: React.ReactNode;
}) {
  return (
    <section className="surface">
      <header className="flex items-start justify-between gap-3 p-4 border-b border-[var(--color-border)]">
        <div>
          <h2 className="h2">{title}</h2>
          {subtitle ? <p className="subtle mt-1">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

// PUBLIC_INTERFACE
export function FieldRow({
  label,
  children,
  hint,
}: {
  /** Field label */
  label: string;
  /** Input element */
  children: React.ReactNode;
  /** Optional hint text */
  hint?: string;
}) {
  return (
    <div className="grid gap-1">
      <label className="label">{label}</label>
      {children}
      {hint ? <div className="subtle">{hint}</div> : null}
    </div>
  );
}

// PUBLIC_INTERFACE
export function ErrorBanner({
  error,
}: {
  /** Error object or message */
  error: unknown;
}) {
  if (!error) return null;
  const message =
    typeof error === "string"
      ? error
      : (error as { message?: string })?.message || "Something went wrong";
  return (
    <div className="surface p-3 border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] text-red-700">
      <strong>Error:</strong> {message}
    </div>
  );
}

// PUBLIC_INTERFACE
export function StatusBadge({
  status,
}: {
  /** Status string */
  status: string;
}) {
  const normalized = (status || "").toLowerCase();
  const cls =
    normalized.includes("overdue") || normalized.includes("critical")
      ? "badge badge-red"
      : normalized.includes("done") || normalized.includes("closed")
      ? "badge badge-cyan"
      : normalized.includes("in progress")
      ? "badge badge-blue"
      : "badge badge-gray";

  return <span className={cls}>{status}</span>;
}
