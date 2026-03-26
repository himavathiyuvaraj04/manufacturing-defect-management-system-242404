"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  return (
    <AppShell>
      <div className="py-6 grid gap-4" style={{ maxWidth: 560 }}>
        <h1 className="h1">Login</h1>
        <ErrorBanner error={error} />
        <Card
          title="JWT Login"
          subtitle="Use backend /auth/login. First user can be created via register."
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
            <FieldRow label="Password">
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
                    const res = await api.login(email, password);
                    setToken(res.access_token);
                    router.push("/");
                  } catch (e) {
                    setError(e);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <button
                className="btn btn-outline"
                onClick={() => router.push("/register")}
              >
                Register
              </button>
            </div>

            <p className="subtle">
              Note: the backend enforces roles; some pages (Admin/Audit) require
              manager/admin.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
