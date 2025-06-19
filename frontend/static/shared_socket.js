const ports = [];
let ws = null;
let reconnectTimeout = null;

function connectWebSocket() {
  if (ws) {
    console.log("[Worker] Closing existing WebSocket before reconnecting");
    ws.onopen = null;
    ws.onclose = null;
    ws.onerror = null;
    ws.onmessage = null;
    ws.close();
  }

  console.log("[Worker] Creating new WebSocket connection...");
  ws = new WebSocket("ws://localhost:8080/ws");

  ws.onopen = () => {
    console.log("[Worker] WebSocket connected");
    broadcast({ type: "status", status: "connected" });
  };

  ws.onmessage = (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.error("[Worker] Invalid JSON received:", event.data);
      return;
    }
    console.log("[Worker] WebSocket message received:", data);
    broadcast(data);
  };

  ws.onclose = (event) => {
    console.warn(`[Worker] WebSocket closed (code: ${event.code}). Reconnecting in 3 seconds...`);
    broadcast({ type: "status", status: "disconnected" });
    reconnectTimeout = setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error("[Worker] WebSocket error:", err);
    // Close socket to trigger reconnect
    if (ws) ws.close();
  };
}

function broadcast(message, excludePort = null) {
  console.log("[Worker] Broadcasting message to ports:", message);
  ports.forEach((port) => {
    if (port !== excludePort) {
      try {
        port.postMessage(message);
      } catch (e) {
        console.error("[Worker] Broadcast error:", e);
      }
    }
  });
}

onconnect = (e) => {
  const port = e.ports[0];
  ports.push(port);
  console.log("[Worker] New port connected. Total ports:", ports.length);
  port.start();

  // Immediately inform port of current connection status
  port.postMessage({
    type: "status",
    status: ws && ws.readyState === WebSocket.OPEN ? "connected" : "disconnected",
  });

  port.onmessage = (event) => {
    console.log("[Worker] Message received from port:", event.data);
    const { type, ...data } = event.data;

    switch (type) {
      case "login":
        console.log("[Worker] login message received: connecting WebSocket");
        connectWebSocket();
        break;

      case "logout":
        console.log("[Worker] logout message received: closing WebSocket");
        if (ws) ws.close();
        break;

      case "message":
      case "start_typing":
      case "stop_typing":
      case "typing":
        if (ws && ws.readyState === WebSocket.OPEN) {
          const json = JSON.stringify({ type, ...data });
          console.log("[Worker] Sending message over WebSocket:", json);
          ws.send(json);
        } else {
          console.warn("[Worker] WebSocket not open. Cannot send:", type);
        }
        break;

      case "offline":
        console.log("[Worker] offline message received: closing WebSocket");
        if (ws) ws.close();
        break;

      default:
        console.warn("[Worker] Unknown message type:", type);
    }
  };

  port.onmessageerror = (err) => {
    console.error("[Worker] Port message error:", err);
  };

  port.onclose = () => {
    console.log("[Worker] Port closed");
    // Remove port reference
    const idx = ports.indexOf(port);
    if (idx !== -1) ports.splice(idx, 1);
    console.log("[Worker] Ports left:", ports.length);
  };
};
