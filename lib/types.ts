import type { ReactNode } from "react";

export type AuthRole = "admin" | "user";
export type TeamRole = "Admin" | "Manager" | "Viewer";
export type Severity = "Low" | "Medium" | "High";
export type RiskLevel = "Low" | "Moderate" | "Elevated" | "Critical";
export type EventType =
  | "Visited"
  | "Download"
  | "Upload"
  | "Blocked"
  | "Form Submit"
  | "Clipboard";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  companyId: string;
  companyName: string;
  avatar: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  title: string;
  team: string;
  avatar: string;
  status: "Online" | "Idle" | "Offline";
  timezone: string;
  lastSeen: string;
  risk: RiskLevel;
};

export type ActivityEvent = {
  id: string;
  userId: string;
  user: string;
  domain: string;
  eventType: EventType;
  timestamp: string;
  status: "Allowed" | "Investigating" | "Blocked";
  risk: RiskLevel;
};

export type AlertItem = {
  id: string;
  title: string;
  user: string;
  severity: Severity;
  rule: string;
  status: "New" | "Triaged" | "Resolved";
  createdAt: string;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type DomainMetric = {
  label: string;
  value: number;
  change?: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "info" | "success" | "warn" | "danger";
};

export type AuthResponse = {
  message?: string;
  user: SessionUser;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  organization: string;
  password: string;
};

export type AuthContextValue = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
};

export type UserProfile = TeamMember & {
  bio: string;
  focusAreas: string[];
  stats: DashboardMetric[];
  timeline: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    tone: "info" | "success" | "warn" | "danger";
  }[];
};

export type TableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  sortValue?: (row: T) => number | string;
  render?: (row: T) => ReactNode;
};
