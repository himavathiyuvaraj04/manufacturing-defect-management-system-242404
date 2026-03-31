"use client";

import React from "react";
import Link from "next/link";

// PUBLIC_INTERFACE
export function SetupGuide({
  title,
  description,
  steps,
  actions,
}: {
  /** Title for the setup/empty state card */
  title: string;
  /** Short description */
  description?: string;
  /** Step list shown to the user */
  steps?: Array<{ label: string; href?: string; hint?: string }>;
  /** Optional actions area (buttons/links) */
  actions?: React.ReactNode;
}) {
  return (
    <section className="surface p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="h2">{title}</div>
          {description ? <div className="subtle mt-1">{description}</div> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {steps && steps.length ? (
        <ol className="mt-3 grid gap-2">
          {steps.map((s, idx) => (
            <li key={`${idx}-${s.label}`} className="subtle">
              <span className="font-semibold">{idx + 1})</span>{" "}
              {s.href ? (
                <Link className="underline" href={s.href}>
                  {s.label}
                </Link>
              ) : (
                <span className="text-[var(--color-text)]">{s.label}</span>
              )}
              {s.hint ? <span className="subtle"> — {s.hint}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
