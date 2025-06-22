import { appState } from "./state.js";
import { start_chat_with_user } from "./chat.js"

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
    fetch(`http://localhost:8080/get_last_user?user_id=${senderId}`)
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
        let user = { id: data.id, nick_name: data.nick_name, is_online: true }
        console.log("the new added user is: ------------------>", data);
        
        console.log(user);
        
        const onlineContainer = document.querySelector("#online-users-list");

        if (!onlineContainer) return;

        // Create user chat div
        const userChat = document.createElement("div");
        userChat.classList.add("user_chat");
        userChat.setAttribute("data-user-id", user.id);
        userChat.setAttribute("role", "button");
        userChat.setAttribute("tabindex", "0");

        // Status indicator
        const status = document.createElement("div");
        status.classList.add("user_status");
        status.classList.add("online");
        status.setAttribute("aria-label", "Online");
        status.title = "Online";

        // User name
        const userName = document.createElement("p");
        userName.textContent = user.nick_name;
        userChat.append(status, userName);

        // Click handler
        userChat.addEventListener("click", () => {
          start_chat_with_user(user);
        });

        // Keyboard accessibility: trigger click on Enter or Space
        userChat.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            start_chat_with_user();
          }
        });

        // Append user to the correct container
        onlineContainer.appendChild(userChat);

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


  // Update status classes
  statusIndicator.classList.toggle("online", isNowOnline);
  statusIndicator.setAttribute("aria-label", "Online");
  statusIndicator.title = "Online"

  onlineContainer.appendChild(userElem);

}
