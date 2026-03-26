"use client";

import React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <AppShell>
      <div className="py-6 grid gap-4">
        <div>
          <h1 className="h1">Admin</h1>
          <p className="subtle mt-1">
            Configure master data (defect types, production lines) and manage users/roles.
          </p>
        </div>

        <div className="grid-2">
          <Card title="Configuration" subtitle="Defect types and production lines">
            <div className="flex items-center gap-2 flex-wrap">
              <Link className="btn btn-primary" href="/admin/config">
                Open config
              </Link>
            </div>
          </Card>

          <Card title="Users & Roles" subtitle="Admin-only user list and role assignment">
            <div className="flex items-center gap-2 flex-wrap">
              <Link className="btn btn-primary" href="/admin/users">
                Manage users
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
