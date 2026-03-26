export type UUID = string;

export type UserResponse = {
  id: UUID;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  roles?: string[];
};

export type TokenResponse = {
  access_token: string;
  token_type?: string;
};

export type DefectResponse = {
  id: UUID;
  defect_number: string;
  occurred_at: string;
  part_number?: string | null;
  description?: string | null;
  defect_type_id?: UUID | null;
  production_line_id?: UUID | null;
  shift_id?: UUID | null;
  quantity_affected: number;
  severity: string;
  status: string;
  reported_by_user_id?: UUID | null;
  tags?: string[] | null;
  extra: Record<string, unknown>;
  photo_path?: string | null;
  created_at: string;
  updated_at: string;
};

export type RcaResponse = {
  id: UUID;
  defect_id: UUID;
  method: string;
  five_whys?: Record<string, unknown> | null;
  fishbone?: Record<string, unknown> | null;
  conclusion?: string | null;
  created_by_user_id?: UUID | null;
  created_at: string;
  updated_at: string;
};

export type RcaUpsert = {
  method: "5-Why" | "Fishbone";
  five_whys?: Record<string, unknown> | null;
  fishbone?: Record<string, unknown> | null;
  conclusion?: string | null;
};

export type CorrectiveActionResponse = {
  id: UUID;
  defect_id: UUID;
  title: string;
  description?: string | null;
  assignee_user_id?: UUID | null;
  due_date?: string | null;
  status: string;
  completed_at?: string | null;
  created_by_user_id?: UUID | null;
  created_at: string;
  updated_at: string;
};

export type CorrectiveActionCreate = {
  defect_id: UUID;
  title: string;
  description?: string | null;
  assignee_user_id?: UUID | null;
  due_date?: string | null;
  status?: string | null;
};

export type CorrectiveActionUpdate = {
  title?: string | null;
  description?: string | null;
  assignee_user_id?: UUID | null;
  due_date?: string | null;
  status?: string | null;
};

export type DashboardOverdueResponse = {
  overdue_actions: number;
  overdue_by_assignee: Array<Record<string, unknown>>;
};

export type ParetoItem = {
  defect_type_code: string;
  defect_type_name: string;
  count: number;
};

export type TrendPoint = {
  period: string;
  count: number;
  critical: number;
  major: number;
  minor: number;
};
