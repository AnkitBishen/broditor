"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { formatDateTime, cx } from "@/lib/utils";
import Link from "next/link";

type AlertDetail = {
  alert: any;
  timeline: any[];
  relatedAlerts: any[];
  employeeRisk: any;
};

export function AlertDetailClient({ initialData }: { initialData: AlertDetail }) {
  const [data, setData] = useState(initialData);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { alert, timeline, relatedAlerts, employeeRisk } = data;

  const severityVariant = (severity: string) => {
    const s = (severity || "").toLowerCase();
    if (s === "high" || s === "critical") return "danger";
    if (s === "medium") return "warn";
    return "info";
  };

  const statusVariant = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "resolved") return "success";
    if (s === "dismissed") return "neutral";
    return "warn";
  };

  const updateAlert = async (updates: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error("Failed to update alert");
      
      const result = await response.json();
      setData({ ...data, alert: { ...alert, ...result.alert } });
    } catch (err) {
      console.error("Failed to update alert:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignToMe = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, we might have an /assign endpoint or just patch status
      await updateAlert({ status: 'assigned' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/alerts/${alert.id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText })
      });
      
      if (!response.ok) throw new Error("Failed to add note");
      
      const result = await response.json();
      setData({ ...data, alert: { ...alert, ...result.alert } });
      setNoteText("");
      setIsNoteModalOpen(false);
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse notes from JSON strings
  const notes = alert.note ? alert.note.split("\n").map((n: string) => {
    try {
      return JSON.parse(n);
    } catch {
      return { message: n, admin_name: "System", timestamp: alert.triggered_at };
    }
  }) : [];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Main Investigation Area */}
      <div className="flex-1 space-y-6">
        {/* SECTION 1 — Alert Header */}
        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={severityVariant(alert.severity)} size="lg" className="uppercase font-bold tracking-wider">
                  {alert.severity}
                </Badge>
                <Badge variant={statusVariant(alert.status)} size="lg" className="capitalize">
                  {alert.status}
                </Badge>
                {alert.occurrence_count && alert.occurrence_count > 1 ? (
                  <Badge variant="danger">x{alert.occurrence_count} Occurrences</Badge>
                ) : null}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{alert.alert_type.replace(/_/g, " ")}</h1>
                <p className="mt-2 text-lg text-slate-300">{alert.trigger_reason}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                    {alert.employee_name ? alert.employee_name.split(" ").map((n: string) => n[0]).join("") : "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{alert.employee_name || "Unassigned Device"}</p>
                    <p className="text-sm text-slate-400">{alert.employee_email || "No email associated"}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <p className="text-sm text-slate-400">Triggered {formatDateTime(alert.triggered_at)}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
               <button 
                 onClick={() => setIsNoteModalOpen(true)}
                 className="btn-surface px-4 py-2 text-sm font-medium"
               >
                 Add Note
               </button>
               {alert.status === 'open' && (
                 <button 
                   onClick={assignToMe}
                   disabled={isSubmitting}
                   className="btn-primary px-4 py-2 text-sm font-medium"
                 >
                   Assign to me
                 </button>
               )}
               {alert.status !== 'resolved' && (
                 <button 
                    onClick={() => updateAlert({ status: 'resolved' })}
                    disabled={isSubmitting}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                 >
                   Resolve
                 </button>
               )}
            </div>
          </div>
        </section>

        {/* SECTION 2 — Investigation Context */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <ContextCard label="Domain" value={alert.domain} />
          <ContextCard label="Category" value={alert.category || "Unknown"} />
          <ContextCard label="Browser" value={alert.browser || "Unknown"} />
          <ContextCard label="OS" value={alert.os || "Unknown"} />
          <ContextCard label="Device ID" value={alert.device_id ? alert.device_id.slice(0, 8) : "N/A"} />
          <ContextCard label="Event Time" value={new Date(alert.triggered_at).toLocaleTimeString()} />
          <ContextCard label="URL" value={alert.url} className="md:col-span-2" isLink />
        </section>

        {/* SECTION 3 — Activity Timeline (VERY IMPORTANT) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-white">Activity Timeline</h2>
             <Badge variant="neutral">60 min window</Badge>
          </div>
          
          <Card className="p-0 overflow-hidden">
            <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-6 py-3 flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
               <span>Event</span>
               <span>Time</span>
            </div>
            <div className="divide-y divide-white/5">
              {timeline.length === 0 ? (
                <div className="p-10 text-center text-slate-500">No events captured around this alert.</div>
              ) : (
                timeline.map((event: any, idx: number) => (
                  <TimelineItem 
                    key={event.id} 
                    event={event} 
                    isAlertEvent={event.id === alert.event_id}
                  />
                ))
              )}
            </div>
          </Card>
        </section>

        {/* SECTION 5 — Notes & Investigation Log */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Investigation Log</h2>
          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-slate-500 italic">No notes added yet.</p>
            ) : (
              notes.map((note: any, idx: number) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {note.admin_name[0]}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">{note.admin_name}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(note.timestamp)}</p>
                    </div>
                    <p className="text-sm text-slate-300">{note.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Right Sidebar for metadata/actions */}
      <aside className="w-full lg:w-80 space-y-6">
        {/* Sticky Container */}
        <div className="sticky top-6 space-y-6">
          {/* SECTION 6 — Employee Risk Context */}
          <Card title="Employee Risk" eyebrow="Security Context">
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Open Alerts</span>
                  <span className={cx("text-sm font-bold", employeeRisk.open_alerts > 0 ? "text-orange-400" : "text-white")}>
                    {employeeRisk.open_alerts}
                  </span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total Alerts</span>
                  <span className="text-sm font-bold text-white">{employeeRisk.total_alerts}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">High Risk Events</span>
                  <span className="text-sm font-bold text-white">{employeeRisk.high_risk_events}</span>
               </div>
               {employeeRisk.total_alerts > 3 && (
                 <Badge variant="danger" className="w-full justify-center py-1">Repeat Offender</Badge>
               )}
            </div>
          </Card>

          {/* SECTION 7 — Related Alerts */}
          <Card title="Related Alerts" eyebrow="Historical Context">
             <div className="space-y-3">
               {relatedAlerts.length === 0 ? (
                 <p className="text-xs text-slate-500 italic">No related alerts found.</p>
               ) : (
                 relatedAlerts.map((ra: any) => (
                   <Link key={ra.id} href={`/alerts/${ra.id}`} className="block group">
                     <div className="p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                       <div className="flex items-center gap-2 mb-1">
                          <Badge variant={severityVariant(ra.severity)} size="sm">{ra.severity}</Badge>
                          <span className="text-[10px] text-slate-500">{new Date(ra.triggered_at).toLocaleDateString()}</span>
                       </div>
                       <p className="text-xs font-medium text-slate-300 truncate group-hover:text-white">{ra.alert_type.replace(/_/g, " ")}</p>
                     </div>
                   </Link>
                 ))
               )}
             </div>
          </Card>

          {/* Device Info */}
          <Card title="System Info" eyebrow="Device Metadata">
             <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID</span>
                  <span className="text-slate-300 font-mono">{alert.device_id || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OS</span>
                  <span className="text-slate-300">{alert.os || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Browser</span>
                  <span className="text-slate-300">{alert.browser || "Unknown"}</span>
                </div>
             </div>
          </Card>
        </div>
      </aside>

      {/* Add Note Modal */}
      <Modal 
        open={isNoteModalOpen} 
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Investigation Note"
      >
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Describe your findings or actions taken..."
            className="w-full h-32 bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsNoteModalOpen(false)}
              className="btn-surface px-4 py-2"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddNote}
              disabled={isSubmitting || !noteText.trim()}
              className="btn-primary px-6 py-2"
            >
              Save Note
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ContextCard({ label, value, className, isLink }: { label: string; value: string; className?: string; isLink?: boolean }) {
  return (
    <div className={cx("rounded-xl border border-white/5 bg-white/[0.02] p-4", className)}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-400 hover:underline truncate block">
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium text-white truncate">{value || "N/A"}</p>
      )}
    </div>
  );
}

function TimelineItem({ event, isAlertEvent }: { event: any; isAlertEvent: boolean }) {
  const riskColor = (level: string) => {
    if (level === 'critical' || level === 'high') return "text-red-400";
    if (level === 'medium') return "text-orange-400";
    return "text-slate-400";
  };

  return (
    <div className={cx(
      "group flex items-center justify-between px-6 py-4 transition-colors",
      isAlertEvent ? "bg-red-500/10 border-l-4 border-l-red-500" : "hover:bg-white/[0.02]"
    )}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={cx(
          "h-8 w-8 rounded-lg flex items-center justify-center border",
          isAlertEvent ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-slate-800 border-white/5 text-slate-400"
        )}>
          {getEventIcon(event.event_type)}
        </div>
        <div className="min-w-0">
           <div className="flex items-center gap-2">
             <p className={cx("text-sm font-semibold truncate", isAlertEvent ? "text-white" : "text-slate-200")}>
               {event.domain || event.event_type}
             </p>
             {event.risk_level !== 'low' && (
               <div className={cx("h-1.5 w-1.5 rounded-full", riskColor(event.risk_level).replace("text", "bg"))} />
             )}
           </div>
           <p className="text-xs text-slate-500 truncate">{event.url || event.event_type}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 ml-4">
        <span className="text-xs font-medium text-slate-400">
          {new Date(event.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isAlertEvent && <Badge variant="danger" size="sm">TRIGGER</Badge>}
      </div>
    </div>
  );
}

function getEventIcon(type: string) {
  switch (type) {
    case 'navigation_completed':
    case 'tabs_updated':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    case 'download':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      );
    case 'idle':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}
