import { navigateTo } from "./script.js";
import { appState } from "./state.js";


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

    case "offline":
      if (appState.currentUser) {
        if (msg.sender == appState.currentUser.id) {
          hideTypingIndicator();
        }
      }
      update_status(msg.sender)
      break;
    case "online":
      update_status(msg.sender)
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

  if (!appState.currentUser || msg.sender != appState.currentUser.id) {
    return
  }
  typingElem.innerText = `User ${appState.currentUser.nick_name} is typing...`;
  typingElem.style.display = "block";
}

function hideTypingIndicator() {
  const typingElem = document.getElementById("typing-indicator");
  if (!typingElem) return;
  typingElem.style.display = "none";
}


function update_status(senderId) {

  const onlineContainer = document.querySelector("#online-users-list");
  const offlineContainer = document.querySelector("#offline-users-list");
  if (!onlineContainer || !offlineContainer) return;

  console.log("Updating status of user:", senderId);

  // Try to find user in both containers
  let userElem = onlineContainer.querySelector(`[data-user-id='${senderId}']`) ||
    offlineContainer.querySelector(`[data-user-id='${senderId}']`);

  if (!userElem) {
    fetch('http://localhost:8080/')
      .then(response => {
        // Check if the request was successful (status code 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse the response body as JSON
        return response.json();
      })
      .then(data => {
        // Process the fetched data
        console.log('Fetched data:', data);
      })
      .catch(error => {
        // Handle any errors that occurred during the fetch operation
        console.error('Error fetching data:', error);
      });
    return;
  }

  const statusIndicator = userElem.querySelector(".user_status");
  if (!statusIndicator) {
    console.warn("Status indicator not found for user:", senderId);
    return;
  }

  const isNowOnline = event.data.type === "online";

  // Update status classes
  statusIndicator.classList.toggle("online", isNowOnline);
  statusIndicator.classList.toggle("offline", !isNowOnline);
  statusIndicator.setAttribute("aria-label", isNowOnline ? "Online" : "Offline");
  statusIndicator.title = isNowOnline ? "Online" : "Offline";

  // Move user to correct container
  const targetContainer = isNowOnline ? onlineContainer : offlineContainer;
  targetContainer.appendChild(userElem);

}
