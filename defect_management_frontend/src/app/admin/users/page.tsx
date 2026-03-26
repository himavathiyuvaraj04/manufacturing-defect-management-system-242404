"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, FieldRow } from "@/components/ui";
import { api } from "@/lib/api";
import type { UserResponse } from "@/lib/types";

export default function AdminUsersPage() {
  const [error, setError] = useState<unknown>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  async function refresh() {
    const data = (await api.listUsers()) as UserResponse[];
    setUsers(data);
  }

  useEffect(() => {
    refresh().catch(setError);
  }, []);

  return (
    <AppShell>
      <div className="py-6 grid gap-4">
        <div>
          <h1 className="h1">Admin / Users</h1>
          <p className="subtle mt-1">
            List users and set roles (admin-only).
          </p>
        </div>

        <ErrorBanner error={error} />

        <Card title="Users" subtitle={`${users.length} user(s)`}>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Active</th>
                  <th>Roles (comma-separated)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    disabled={saving === u.id}
                    onSave={async (roles) => {
                      try {
                        setSaving(u.id);
                        setError(null);
                        await api.setUserRoles(u.id, roles);
                        await refresh();
                      } catch (e) {
                        setError(e);
                      } finally {
                        setSaving(null);
                      }
                    }}
                  />
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="subtle">
                      No users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function UserRow({
  user,
  disabled,
  onSave,
}: {
  user: UserResponse;
  disabled: boolean;
  onSave: (roles: string[]) => Promise<void>;
}) {
  const [rolesText, setRolesText] = useState((user.roles || []).join(", "));

  return (
    <tr>
      <td className="font-mono">{user.email}</td>
      <td>{user.full_name || "—"}</td>
      <td>{user.is_active ? "Yes" : "No"}</td>
      <td style={{ minWidth: 260 }}>
        <FieldRow label="">
          <input
            className="input"
            value={rolesText}
            onChange={(e) => setRolesText(e.target.value)}
            placeholder="admin, manager, operator"
          />
        </FieldRow>
      </td>
      <td>
        <button
          className="btn btn-primary"
          disabled={disabled}
          onClick={() =>
            onSave(
              rolesText
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            )
          }
        >
          Save roles
        </button>
      </td>
    </tr>
  );
}
