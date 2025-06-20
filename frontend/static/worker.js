export const worker = new SharedWorker("./static/shared_socket.js");

worker.port.start();

worker.port.onmessage = (event) => {
  const msg = event.data;
  console.log("[Main] Message from worker:", msg);

  switch (msg.type) {
    case "message":
      displayMessage(msg);
      break;

    case "start_typing":
      showTypingIndicator(msg);
      break;

    case "stop_typing":
      hideTypingIndicator();
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
  const container = document.getElementById("messages-container");
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", "received"); // always "received"

  // Insert message content (you can add timestamp if you have it)
  msgDiv.innerText = msg.content;

  container.appendChild(msgDiv);

  // Scroll chat to bottom
  container.scrollTop = container.scrollHeight;
}


function showTypingIndicator(msg) {
  const typingElem = document.getElementById("typing-indicator");
  if (!typingElem) return;

  typingElem.innerText = `User ${msg.sender} is typing...`;
  typingElem.style.display = "block";
}

function hideTypingIndicator() {
  const typingElem = document.getElementById("typing-indicator");
  if (!typingElem) return;

  typingElem.style.display = "none";
}
