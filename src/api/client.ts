import type { BreathSession, BreathSessionListResponse } from "../types.js";

const BASE_URL = process.env.MIND_API_URL;
const TOKEN = process.env.MIND_PAT_TOKEN;

if (!BASE_URL || !TOKEN) {
  throw new Error("MIND_API_URL and MIND_PAT_TOKEN must be set");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchSessions(
  page?: number,
  pageSize?: number,
): Promise<BreathSessionListResponse> {
  const params = new URLSearchParams();
  if (page !== undefined) params.set("page", String(page));
  if (pageSize !== undefined) params.set("pageSize", String(pageSize));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request<BreathSessionListResponse>(`/breath_sessions/list${qs}`);
}

export async function fetchSession(id: string): Promise<BreathSession> {
  return request<BreathSession>(`/breath_sessions/${id}`);
}

export async function patchSession(
  id: string,
  data: Partial<BreathSession>,
): Promise<BreathSession> {
  return request<BreathSession>(`/breath_sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
