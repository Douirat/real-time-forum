export const worker = new SharedWorker("./static/shared_socket.js");

worker.port.start();

worker.port.onmessage = (event) => {
  const msg = event.data;
  console.log("[Main] Message from worker:", msg);

  switch (msg.type) {
    case "message":
      displayMessage(msg);
      break;

    case "typing":
      showTypingIndicator(msg);
      break;

    case "stop_typing":
      hideTypingIndicator(msg);
      break;

    case "status":
      console.log("[Main] WebSocket status:", msg.status);
      // Optionally update UI status indicator here
      break;

    default:
      console.warn("[Main] Unknown message type received:", msg);
  }
};

worker.port.onmessageerror = (err) => {
  console.error("[Main] Message error from worker port:", err);
};

worker.port.onclose = () => {
  console.warn("[Main] Worker port closed");
};

export function sendMessage(worker, message) {
  console.log("[Main] Sending message to worker:", message);
  worker.port.postMessage(message);
}

// Placeholder functions for UI updates:

function displayMessage(msg) {
  console.log("[Main] Display message:", msg);
  // TODO: Insert message into chat UI here
}

function showTypingIndicator(msg) {
  console.log("[Main] Show typing indicator:", msg);
  // TODO: Show "User is typing..." in UI
}

function hideTypingIndicator(msg) {
  console.log("[Main] Hide typing indicator:", msg);
  // TODO: Remove typing indicator in UI
}
