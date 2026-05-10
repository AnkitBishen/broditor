import { getSessionToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function apiFetchAsCurrentUser<T>(path: string): Promise<T> {
  return apiRequestAsCurrentUser<T>(path);
}

export async function apiRequestAsCurrentUser<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, ...requestInit } = init;
  const token = await getSessionToken();

  if (!token) {
    throw new Error("Missing authenticated session");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let body = requestInit.body;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    body,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiDownloadAsCurrentUser(path: string, init: RequestInit = {}) {
  const token = await getSessionToken();

  if (!token) {
    throw new Error("Missing authenticated session");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `API request failed with status ${response.status}`);
  }

  return response;
}
