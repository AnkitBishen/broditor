import type {
  ActivityEvent,
  AlertItem,
  DashboardMetric,
  DomainMetric,
  EventType,
  TeamMember,
  TrendPoint,
  UserProfile
} from "@/lib/types";

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export const teamMembers: TeamMember[] = [
  {
    id: "u_1",
    name: "Amara Singh",
    email: "amara@northstar.io",
    role: "Admin",
    title: "Director of Security Operations",
    team: "Security",
    avatar: "AS",
    status: "Online",
    timezone: "IST",
    lastSeen: "Active now",
    risk: "Moderate"
  },
  {
    id: "u_2",
    name: "Jonah Reed",
    email: "jonah@northstar.io",
    role: "Manager",
    title: "Compliance Manager",
    team: "Compliance",
    avatar: "JR",
    status: "Idle",
    timezone: "EST",
    lastSeen: "12 mins ago",
    risk: "Elevated"
  },
  {
    id: "u_3",
    name: "Nadia Flores",
    email: "nadia@northstar.io",
    role: "Viewer",
    title: "Audit Analyst",
    team: "Risk",
    avatar: "NF",
    status: "Online",
    timezone: "CET",
    lastSeen: "Active now",
    risk: "Low"
  },
  {
    id: "u_4",
    name: "Ethan Blake",
    email: "ethan@northstar.io",
    role: "Manager",
    title: "IT Operations Lead",
    team: "IT",
    avatar: "EB",
    status: "Offline",
    timezone: "PST",
    lastSeen: "1 hr ago",
    risk: "Critical"
  },
  {
    id: "u_5",
    name: "Mila Chen",
    email: "mila@northstar.io",
    role: "Viewer",
    title: "Vendor Assurance Analyst",
    team: "Procurement",
    avatar: "MC",
    status: "Online",
    timezone: "SGT",
    lastSeen: "2 mins ago",
    risk: "Moderate"
  }
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Total users",
    value: "1,284",
    delta: "+8.2% from last week",
    tone: "info"
  },
  {
    label: "Total events",
    value: "482.6K",
    delta: "+34.1K today",
    tone: "success"
  },
  {
    label: "Alerts today",
    value: "27",
    delta: "4 require escalation",
    tone: "warn"
  }
];

export const activityTrend: TrendPoint[] = [
  { label: "Mon", value: 72 },
  { label: "Tue", value: 98 },
  { label: "Wed", value: 88 },
  { label: "Thu", value: 124 },
  { label: "Fri", value: 116 },
  { label: "Sat", value: 84 },
  { label: "Sun", value: 91 }
];

export const weeklyTrend: TrendPoint[] = [
  { label: "W1", value: 44 },
  { label: "W2", value: 59 },
  { label: "W3", value: 63 },
  { label: "W4", value: 78 },
  { label: "W5", value: 74 },
  { label: "W6", value: 88 }
];

export const domainUsage: DomainMetric[] = [
  { label: "github.com", value: 36, change: "+6%" },
  { label: "notion.so", value: 24, change: "+3%" },
  { label: "salesforce.com", value: 18, change: "-2%" },
  { label: "drive.google.com", value: 13, change: "+8%" },
  { label: "slack.com", value: 9, change: "+1%" }
];

export const timeSpent: DomainMetric[] = [
  { label: "Internal tools", value: 31, change: "31 hrs" },
  { label: "Customer portals", value: 22, change: "22 hrs" },
  { label: "Cloud consoles", value: 16, change: "16 hrs" },
  { label: "File storage", value: 14, change: "14 hrs" },
  { label: "Unclassified", value: 7, change: "7 hrs" }
];

export const alertItems: AlertItem[] = [
  {
    id: "a_1",
    title: "Credential paste detected on external domain",
    user: "Ethan Blake",
    severity: "High",
    rule: "Sensitive input on unknown destination",
    status: "New",
    createdAt: "2026-04-10T09:12:00.000Z"
  },
  {
    id: "a_2",
    title: "Bulk export from CRM after hours",
    user: "Jonah Reed",
    severity: "Medium",
    rule: "Anomalous export volume",
    status: "Triaged",
    createdAt: "2026-04-10T08:21:00.000Z"
  },
  {
    id: "a_3",
    title: "Attempted upload to unsanctioned storage",
    user: "Mila Chen",
    severity: "High",
    rule: "Blocked exfiltration pattern",
    status: "New",
    createdAt: "2026-04-10T07:34:00.000Z"
  },
  {
    id: "a_4",
    title: "Repeated blocked domain visits",
    user: "Nadia Flores",
    severity: "Low",
    rule: "Policy training opportunity",
    status: "Resolved",
    createdAt: "2026-04-09T18:05:00.000Z"
  }
];

const eventTypes: EventType[] = ["Visited", "Download", "Upload", "Blocked", "Form Submit", "Clipboard"];

export const activityEvents: ActivityEvent[] = [
  {
    id: "e_1",
    userId: "u_1",
    user: "Amara Singh",
    domain: "github.com",
    eventType: "Visited",
    timestamp: "2026-04-10T09:52:00.000Z",
    status: "Allowed",
    risk: "Low"
  },
  {
    id: "e_2",
    userId: "u_2",
    user: "Jonah Reed",
    domain: "salesforce.com",
    eventType: "Download",
    timestamp: "2026-04-10T09:28:00.000Z",
    status: "Investigating",
    risk: "Elevated"
  },
  {
    id: "e_3",
    userId: "u_4",
    user: "Ethan Blake",
    domain: "dropbox-transfer.com",
    eventType: "Blocked",
    timestamp: "2026-04-10T09:12:00.000Z",
    status: "Blocked",
    risk: "Critical"
  },
  {
    id: "e_4",
    userId: "u_5",
    user: "Mila Chen",
    domain: "docs.google.com",
    eventType: "Form Submit",
    timestamp: "2026-04-10T08:51:00.000Z",
    status: "Allowed",
    risk: "Moderate"
  },
  {
    id: "e_5",
    userId: "u_3",
    user: "Nadia Flores",
    domain: "notion.so",
    eventType: "Clipboard",
    timestamp: "2026-04-10T08:14:00.000Z",
    status: "Investigating",
    risk: "Moderate"
  },
  {
    id: "e_6",
    userId: "u_2",
    user: "Jonah Reed",
    domain: "jira.company.com",
    eventType: "Visited",
    timestamp: "2026-04-10T07:44:00.000Z",
    status: "Allowed",
    risk: "Low"
  },
  {
    id: "e_7",
    userId: "u_1",
    user: "Amara Singh",
    domain: "okta.com",
    eventType: "Form Submit",
    timestamp: "2026-04-10T07:28:00.000Z",
    status: "Allowed",
    risk: "Low"
  },
  {
    id: "e_8",
    userId: "u_4",
    user: "Ethan Blake",
    domain: "wetransfer.com",
    eventType: "Upload",
    timestamp: "2026-04-10T07:02:00.000Z",
    status: "Blocked",
    risk: "Critical"
  },
  {
    id: "e_9",
    userId: "u_5",
    user: "Mila Chen",
    domain: "box.com",
    eventType: "Upload",
    timestamp: "2026-04-09T18:48:00.000Z",
    status: "Investigating",
    risk: "Elevated"
  },
  {
    id: "e_10",
    userId: "u_3",
    user: "Nadia Flores",
    domain: "slack.com",
    eventType: "Visited",
    timestamp: "2026-04-09T18:26:00.000Z",
    status: "Allowed",
    risk: "Low"
  },
  {
    id: "e_11",
    userId: "u_1",
    user: "Amara Singh",
    domain: "drive.google.com",
    eventType: "Download",
    timestamp: "2026-04-09T17:11:00.000Z",
    status: "Allowed",
    risk: "Moderate"
  },
  {
    id: "e_12",
    userId: "u_2",
    user: "Jonah Reed",
    domain: "airtable.com",
    eventType: "Clipboard",
    timestamp: "2026-04-09T16:50:00.000Z",
    status: "Investigating",
    risk: "Elevated"
  }
];

export const eventTypeOptions = ["All", ...eventTypes];

const userProfiles: Record<string, UserProfile> = {
  u_1: {
    ...teamMembers[0],
    bio: "Owns browser monitoring policy, escalations, and weekly audit review across security and IT.",
    focusAreas: ["Privileged access", "Cloud activity", "Third-party risk"],
    stats: [
      { label: "Events reviewed", value: "1,420", delta: "+13% this week", tone: "info" },
      { label: "Policies enforced", value: "32", delta: "3 updated today", tone: "success" },
      { label: "Open escalations", value: "4", delta: "2 high priority", tone: "warn" }
    ],
    timeline: [
      {
        id: "t1",
        title: "Escalated credential paste incident",
        description: "Opened case and assigned incident response owner.",
        timestamp: "2026-04-10T09:17:00.000Z",
        tone: "danger"
      },
      {
        id: "t2",
        title: "Approved revised cloud upload policy",
        description: "Expanded allowlist for internal vendor portals.",
        timestamp: "2026-04-10T06:35:00.000Z",
        tone: "success"
      },
      {
        id: "t3",
        title: "Reviewed weekend anomaly digest",
        description: "Closed 7 low-risk blocked-domain events.",
        timestamp: "2026-04-09T18:02:00.000Z",
        tone: "info"
      }
    ]
  },
  u_2: {
    ...teamMembers[1],
    bio: "Runs compliance controls, evidence collection, and audit readiness for regulated customer accounts.",
    focusAreas: ["Evidence exports", "PII workflows", "Retention"],
    stats: [
      { label: "Items exported", value: "286", delta: "+19 today", tone: "info" },
      { label: "Exceptions filed", value: "7", delta: "1 pending approval", tone: "warn" },
      { label: "Controls mapped", value: "114", delta: "+4 this month", tone: "success" }
    ],
    timeline: [
      {
        id: "t4",
        title: "Bulk export flagged",
        description: "CRM export exceeded baseline threshold and created a medium alert.",
        timestamp: "2026-04-10T08:21:00.000Z",
        tone: "warn"
      },
      {
        id: "t5",
        title: "Completed evidence package review",
        description: "Shared final controls packet with customer success.",
        timestamp: "2026-04-09T17:48:00.000Z",
        tone: "success"
      }
    ]
  }
};

export async function getDashboardSnapshot() {
  await delay();

  return {
    metrics: dashboardMetrics,
    activityTrend,
    domainUsage,
    recentActivity: activityEvents.slice(0, 6),
    alerts: alertItems.slice(0, 3)
  };
}

export async function getActivityLogs() {
  await delay();
  return activityEvents;
}

export async function getAlerts() {
  await delay();
  return alertItems;
}

export async function getTeamMembers() {
  await delay();
  return teamMembers;
}

export async function getAnalyticsSnapshot() {
  await delay();
  return {
    timeSpent,
    domainUsage,
    weeklyTrend,
    activityTrend
  };
}

export async function getUserProfile(id: string) {
  await delay();
  return userProfiles[id] ?? userProfiles.u_1;
}
