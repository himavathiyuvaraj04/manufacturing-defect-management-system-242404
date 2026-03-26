import { getToken } from "./auth";

const DEFAULT_BASE_URL = "http://localhost:3001";

/**
 * API base URL for backend.
 * IMPORTANT: This app expects backend to be reachable on port 3001.
 * You can override by setting NEXT_PUBLIC_API_BASE_URL in the frontend .env.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BASE_URL;

type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

async function parseError(res: Response): Promise<ApiError> {
  let details: unknown = undefined;
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) details = await res.json();
    else details = await res.text();
  } catch {
    // ignore parse error
  }
  return {
    status: res.status,
    message: `Request failed (${res.status})`,
    details,
  };
}

async function request<T>(
  path: string,
  options: RequestInit & { isMultipart?: boolean } = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // For JSON requests, default content-type.
  if (!options.isMultipart && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  // Export endpoints return file-ish responses; callers can use fetch directly if needed.
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await (res.text() as unknown as Promise<T>)) as T;
}

// PUBLIC_INTERFACE
export const api = {
  /** Auth */
  async login(email: string, password: string) {
    return request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  async register(payload: {
    email: string;
    password: string;
    full_name?: string | null;
    roles?: string[];
  }) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async me() {
    return request("/users/me", { method: "GET" });
  },
  async listUsers() {
    return request("/users", { method: "GET" });
  },
  async setUserRoles(userId: string, roles: string[]) {
    return request(`/users/${userId}/roles`, {
      method: "POST",
      body: JSON.stringify(roles),
    });
  },

  /** Config */
  async listDefectTypes() {
    return request<Array<Record<string, unknown>>>("/config/defect-types");
  },
  async createDefectType(code: string, name: string, defaultSeverity?: string) {
    const body = new URLSearchParams();
    body.set("code", code);
    body.set("name", name);
    if (defaultSeverity) body.set("default_severity", defaultSeverity);
    return request<Record<string, unknown>>("/config/defect-types", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  },
  async listProductionLines() {
    return request<Array<Record<string, unknown>>>("/config/production-lines");
  },
  async createProductionLine(code: string, name?: string) {
    const body = new URLSearchParams();
    body.set("code", code);
    if (name) body.set("name", name);
    return request<Record<string, unknown>>("/config/production-lines", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  },
  async listShifts() {
    return request<Array<Record<string, unknown>>>("/config/shifts");
  },

  /** Defects */
  async listDefects(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/defects${suffix}`);
  },
  async createDefect(form: FormData) {
    return request("/defects", {
      method: "POST",
      body: form,
      isMultipart: true,
      headers: {}, // let browser set boundary
    });
  },
  async getDefect(defectId: string) {
    return request(`/defects/${defectId}`);
  },
  async updateDefect(defectId: string, payload: Record<string, unknown>) {
    return request(`/defects/${defectId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  async uploadDefectPhoto(defectId: string, photo: File) {
    const form = new FormData();
    form.append("photo", photo);
    return request(`/defects/${defectId}/photo`, {
      method: "POST",
      body: form,
      isMultipart: true,
      headers: {},
    });
  },

  /** RCA */
  async getRca(defectId: string) {
    return request(`/defects/${defectId}/rca`);
  },
  async upsertRca(defectId: string, payload: Record<string, unknown>) {
    return request(`/defects/${defectId}/rca`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /** Actions */
  async listActions(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/actions${suffix}`);
  },
  async createAction(payload: Record<string, unknown>) {
    return request("/actions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateAction(actionId: string, payload: Record<string, unknown>) {
    return request(`/actions/${actionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /** Dashboard */
  async dashboardOverdue() {
    return request("/dashboard/overdue");
  },
  async dashboardPareto(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/dashboard/pareto${suffix}`);
  },
  async dashboardTrends(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/dashboard/trends${suffix}`);
  },

  /** Audit */
  async listAudit(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/audit${suffix}`);
  },
};

export { API_BASE_URL };
