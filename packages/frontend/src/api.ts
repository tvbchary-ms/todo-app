const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

const TOKEN_KEY = "todo_token";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

export interface BackendTodo {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(
  path: string,
  init: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

async function authed(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  if (!token) throw new ApiError(401, "Not authenticated");
  const res = await request(path, init, token);
  if (res.status === 401) {
    setStoredToken(null);
    throw new ApiError(401, "Session expired, please sign in again");
  }
  return res;
}

// ─── Auth ────────────────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  name: string
): Promise<{ user: User; token: string }> {
  const res = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const body = await res.json();
  setStoredToken(body.data.token);
  return body.data;
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const res = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const body = await res.json();
  setStoredToken(body.data.token);
  return body.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await authed("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
}

export async function forgotPassword(email: string, newPassword: string): Promise<void> {
  const res = await request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, newPassword }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
}

export async function logout(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  try {
    await request("/api/auth/logout", { method: "POST" }, token);
  } finally {
    setStoredToken(null);
  }
}

export async function me(): Promise<User> {
  const res = await authed("/api/auth/me");
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const body = await res.json();
  return body.data as User;
}

// ─── Todos ───────────────────────────────────────────────────

export async function listTodos(): Promise<BackendTodo[]> {
  const res = await authed("/api/todos?limit=100&sortBy=createdAt&sortOrder=desc");
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const body = await res.json();
  return body.data as BackendTodo[];
}

export async function createTodo(title: string): Promise<BackendTodo> {
  const res = await authed("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const body = await res.json();
  return body.data as BackendTodo;
}

export async function setTodoStatus(
  id: string,
  status: BackendTodo["status"]
): Promise<BackendTodo> {
  const res = await authed(`/api/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const body = await res.json();
  return body.data as BackendTodo;
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await authed(`/api/todos/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new ApiError(res.status, await parseError(res));
  }
}

// ─── Admin ───────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

export interface AdminSession {
  id: string;
  userId: string;
  userEmail: string;
  expiresAt: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  userId: string | null;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeSessions: number;
  auditToday: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await authed("/api/admin/stats");
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return (await res.json()).data as AdminStats;
}

export async function listAllUsers(): Promise<AdminUser[]> {
  const res = await authed("/api/admin/users");
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return (await res.json()).data as AdminUser[];
}

export async function updateAdminUser(
  userId: string,
  updates: { name?: string; role?: "admin" | "user" }
): Promise<AdminUser> {
  const res = await authed(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return (await res.json()).data as AdminUser;
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const res = await authed(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const res = await authed(`/api/admin/users/${userId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new ApiError(res.status, await parseError(res));
}

export async function listAdminSessions(
  page: number,
  limit: number
): Promise<Paginated<AdminSession>> {
  const res = await authed(`/api/admin/sessions?page=${page}&limit=${limit}`);
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const body = await res.json();
  return { data: body.data, total: body.total };
}

export async function revokeAdminSession(sessionId: string): Promise<void> {
  const res = await authed(`/api/admin/sessions/${sessionId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new ApiError(res.status, await parseError(res));
}

export async function listAdminAuditLogs(
  page: number,
  limit: number
): Promise<Paginated<AdminAuditLog>> {
  const res = await authed(`/api/admin/audit-logs?page=${page}&limit=${limit}`);
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const body = await res.json();
  return { data: body.data, total: body.total };
}
