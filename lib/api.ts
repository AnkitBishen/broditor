import { activityEvents, teamMembers } from "@/lib/mock-data";
import type { AuthResponse, RegisterPayload, SessionUser } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return fetch("/api/session/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
  },
  register(payload: RegisterPayload) {
    return fetch("/api/session/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  logout() {
    return fetch("/api/session/logout", {
      method: "POST"
    });
  },
  async me() {
    const response = await fetch("/api/session/me", {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { user: SessionUser | null };
    return data.user;
  },
  async getUsers() {
    try {
      return await apiRequest<typeof teamMembers>("/users");
    } catch {
      return teamMembers;
    }
  },
  async getEvents() {
    try {
      return await apiRequest<typeof activityEvents>("/events");
    } catch {
      return activityEvents;
    }
  }
};
