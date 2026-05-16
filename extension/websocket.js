import { getCachedManagedConfig } from "./config.js";
import { getAuthToken, getUserToken, setWebsocketBackoffMs, getWebsocketBackoffMs } from "./storage.js";

let socket = null;
let reconnectTimer = null;

function toWebSocketUrl(apiEndpoint, token) {
  const httpUrl = new URL(apiEndpoint);
  httpUrl.protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
  httpUrl.pathname = "/events/live";
  httpUrl.searchParams.set("token", token);
  return httpUrl.toString();
}

export async function connectLiveSocket() {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  const config = await getCachedManagedConfig();
  const url = toWebSocketUrl(config.apiEndpoint, token);
  socket = new WebSocket(url);

  socket.addEventListener("open", async () => {
    await setWebsocketBackoffMs(1000);
  });

  socket.addEventListener("close", async () => {
    const current = await getWebsocketBackoffMs();
    const next = Math.min(current * 2, 60000);
    await setWebsocketBackoffMs(next);
    reconnectTimer = setTimeout(() => {
      connectLiveSocket().catch(() => {});
    }, current);
  });

  socket.addEventListener("error", () => {
    socket?.close();
  });

  return socket;
}

export async function emitRiskEvent(event) {
  const liveSocket = await connectLiveSocket();
  if (!liveSocket || liveSocket.readyState !== WebSocket.OPEN) {
    return false;
  }

  const userToken = await getUserToken();
  liveSocket.send(JSON.stringify({ 
    event,
    userToken: userToken || null
  }));
  return true;
}
