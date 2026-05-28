"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/Badge";
import { formatDateTime, cx } from "@/lib/utils";

type Alert = {
  id: string;
  alert_type: string;
  severity: string;
  trigger_reason: string;
  employee_id: string;
  triggered_at: string;
};

export function AlertToaster() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    let socket: WebSocket | null = null;

    // Use a relative URL for WebSocket to match the environment
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // This will be localhost:3000 in dev
    // But the backend is on port 4000. We need to handle this.
    // In dev, NEXT_PUBLIC_API_BASE_URL is usually http://localhost:4000/api
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || `http://${window.location.hostname}:4000/api`;
    const wsUrl = new URL(apiBase);
    wsUrl.protocol = protocol;
    wsUrl.pathname = "/ws/dashboard";
    
    async function connect() {
      try {
        const res = await fetch("/api/session/ws-token");
        if (!active) return;
        const { token } = await res.json();
        if (!active) return;
        if (!token) {
          console.warn("[AlertToaster] WS token is null, retrying connection in 5s...");
          setTimeout(() => {
            if (active) connect();
          }, 5000);
          return;
        }

        wsUrl.searchParams.set("token", token);
        socket = new WebSocket(wsUrl.toString());

        socket.onmessage = (event) => {
          if (!active) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "NEW_ALERT") {
              const alert = data.alert;
              setToasts((prev) => {
                // Prevent duplicate toast objects from being added with the same id
                if (prev.some((t) => t.id === alert.id)) {
                  return prev;
                }
                return [alert, ...prev].slice(0, 5);
              });
              
              // Auto-remove toast after 10 seconds
              setTimeout(() => {
                if (active) {
                  setToasts((prev) => prev.filter((t) => t.id !== alert.id));
                }
              }, 10000);
            }
          } catch (err) {
            console.error("WS Message error:", err);
          }
        };

        socket.onclose = () => {
          if (active) {
            setTimeout(() => {
              if (active) connect();
            }, 5000); // Reconnect
          }
        };
      } catch (err) {
        console.error("WS Connect error:", err);
        if (active) {
          setTimeout(() => {
            if (active) connect();
          }, 5000);
        }
      }
    }

    connect();

    return () => {
      active = false;
      socket?.close();
    };
  }, [user]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-md">
      {toasts.map((alert) => (
        <div 
          key={alert.id}
          className="animate-in slide-in-from-right rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-start gap-4">
            <div className={cx(
              "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-lg",
              alert.severity === 'high' || alert.severity === 'critical' ? "bg-red-500/20 text-red-400" :
              alert.severity === 'medium' ? "bg-orange-500/20 text-orange-400" :
              "bg-emerald-500/20 text-emerald-400"
            )}>
              {alert.severity === 'high' || alert.severity === 'critical' ? "🔴" :
               alert.severity === 'medium' ? "🟡" : "🟢"}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  New {alert.severity} Alert
                </p>
                <span className="text-[10px] text-slate-500">{formatDateTime(alert.triggered_at)}</span>
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {alert.alert_type.replace(/_/g, " ")}
              </h3>
              <p className="text-xs text-slate-400">
                {alert.trigger_reason}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button 
              onClick={() => window.location.href = `/alerts/${alert.id}`}
              className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Investigate →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
