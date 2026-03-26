"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { clearToken, getToken } from "@/lib/auth";

function NavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-xl text-sm font-semibold border ${
        active
          ? "bg-[rgba(59,130,246,0.12)] border-[rgba(59,130,246,0.35)] text-blue-700"
          : "bg-white border-[var(--color-border)] text-[var(--color-text)]"
      }`}
    >
      {label}
    </Link>
  );
}

// PUBLIC_INTERFACE
export function AppShell({
  children,
}: {
  /** Main page content */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token = getToken();

  return (
    <div>
      <header className="bg-white border-b border-[var(--color-border)]">
        <div className="container flex items-center justify-between gap-3">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: "var(--color-primary)" }}
                aria-hidden="true"
              />
              <span className="font-extrabold tracking-tight">
                Defect Management
              </span>
            </Link>

            <nav className="flex items-center gap-2 flex-wrap">
              <NavItem href="/" label="Dashboard" />
              <NavItem href="/defects/new" label="Log Defect" />
              <NavItem href="/defects" label="Defects" />
              <NavItem href="/actions" label="Actions" />
              <NavItem href="/audit" label="Audit" />
              <NavItem href="/admin" label="Admin" />
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {token ? (
              <>
                <Link href="/export" className="btn btn-outline">
                  Export
                </Link>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    clearToken();
                    router.push("/login");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container">{children}</main>

      <footer className="container subtle" style={{ paddingBottom: 26 }}>
        <div className="mt-6">
          Backend API expected at{" "}
          <span className="font-mono">
            {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}
          </span>
        </div>
      </footer>
    </div>
  );
}
