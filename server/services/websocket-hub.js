const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");

const API_SECRET = process.env.API_JWT_SECRET || "change-this-in-production";

function createWebsocketHub(server, handlers = {}) {
  const wss = new WebSocketServer({ noServer: true });
  const extensionClients = new Map();
  const dashboardClients = new Map();

  function addClient(map, orgId, socket) {
    const existing = map.get(orgId) ?? new Set();
    existing.add(socket);
    map.set(orgId, existing);

    socket.on("close", () => {
      const group = map.get(orgId);
      if (!group) {
        return;
      }
      group.delete(socket);
      if (group.size === 0) {
        map.delete(orgId);
      }
    });
  }

  function broadcast(map, orgId, payload) {
    const group = map.get(orgId);
    if (!group) {
      return;
    }

    const body = JSON.stringify(payload);
    for (const socket of group) {
      if (socket.readyState === socket.OPEN) {
        socket.send(body);
      }
    }
  }

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, "http://localhost");

    if (url.pathname !== "/events/live" && url.pathname !== "/ws/dashboard") {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get("token");
    if (!token) {
      socket.destroy();
      return;
    }

    let payload;
    try {
      payload = jwt.verify(token, API_SECRET);
    } catch {
      socket.destroy();
      return;
    }

    const orgId = payload.org_id ?? payload.company_id;
    if (!orgId) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.orgId = orgId;
      ws.tokenType = payload.token_type ?? "user";
      ws.role = payload.role ?? null;

      if (url.pathname === "/events/live") {
        addClient(extensionClients, orgId, ws);
        ws.on("message", (message) => {
          try {
            const payload = JSON.parse(message.toString());
            handlers.onRiskEvent?.({
              orgId,
              tokenType: ws.tokenType,
              role: ws.role,
              deviceId: payload.deviceId ?? payload.device_id ?? null,
              event: payload.event ?? payload,
              userToken: payload.userToken ?? null
            });
          } catch {}
        });
      } else {
        addClient(dashboardClients, orgId, ws);
      }

      ws.send(JSON.stringify({ type: "connected", orgId, channel: url.pathname }));
    });
  });

  return {
    broadcastAlert(orgId, alert) {
      broadcast(dashboardClients, orgId, { type: "alert.created", payload: alert });
    },
    broadcastRiskEvent(orgId, event) {
      broadcast(dashboardClients, orgId, { type: "event.risk", payload: event });
    }
  };
}

module.exports = {
  createWebsocketHub
};
