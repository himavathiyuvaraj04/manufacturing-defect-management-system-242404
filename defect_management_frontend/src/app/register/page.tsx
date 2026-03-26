"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <AppShell>
      <div className="py-6 grid gap-4" style={{ maxWidth: 560 }}>
        <h1 className="h1">Register</h1>
        <ErrorBanner error={error} />
        <Card
          title="Create account"
          subtitle="The first user created becomes admin automatically (bootstrap behavior)."
        >
          <div className="grid gap-3">
            <FieldRow label="Email">
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </FieldRow>
            <FieldRow label="Full name (optional)">
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Password (min 8 chars)">
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </FieldRow>

            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary"
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    await api.register({
                      email,
                      password,
                      full_name: fullName || null,
                      roles: [],
                    });
                    router.push("/login");
                  } catch (e) {
                    setError(e);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Creating…" : "Create account"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => router.push("/login")}
              >
                Back to login
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
