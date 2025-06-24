import { appState } from "../../utils/state.js";
import { mark_messages_as_read } from "./chat.js"
import { load_users, setupUserScrollListener } from "../users/users.js";

export const worker = new SharedWorker("./web_socket/shared_socket.js");

worker.port.start();

worker.port.onmessage = (event) => {
  const users_container = document.querySelector("#chat_users");
  const msg = event.data;
  console.log("[Main] Message from worker ->---------> :", msg);

  switch (msg.type) {
    case "message":
      displayMessage(msg);
      if (appState.chat_user) {
        if (msg.sender == appState.chat_user.id) {
          mark_messages_as_read(msg.sender)
        }
      }
      appState.users_offset = 0
      if (users_container) {
        users_container.innerHTML = "";
      }
      setupUserScrollListener()
      load_users()
      break;

    case "start_typing":
      showTypingIndicator(msg);
      break;
    case "stop_typing":
      hideTypingIndicator();
      break;
    case "offline":

      if (appState.chat_user) {
        if (msg.sender == appState.chat_user.id) {
          hideTypingIndicator();
        }
      }

      // update_status(msg.sender)
      console.log("the state is: ", appState);
      appState.users_offset = 0
      if (users_container) {
        users_container.innerHTML = "";
      }
      setupUserScrollListener()
      load_users()
      break;
    case "online":
      // update_status(msg.sender)
      appState.users_offset = 0
      console.log("the state is: ", appState);
      if (users_container) {
        users_container.innerHTML = "";
      }
      setupUserScrollListener()
      load_users()
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

  const isSentByAppUser = msg.sender_id === appState.app_user.id;

  // Create message wrapper
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  msgDiv.classList.add(isSentByAppUser ? "sent" : "received");

  // Sender name
  const senderDiv = document.createElement("div");
  senderDiv.classList.add("message_creator");
  senderDiv.textContent = isSentByAppUser
    ? appState.app_user.nick_name
    : appState.chat_user.nick_name;

  // Message content
  const contentDiv = document.createElement("div");
  contentDiv.classList.add("content");
  contentDiv.textContent = msg.content;

  // Generate current timestamp
  const dateDiv = document.createElement("div");
  dateDiv.classList.add("message_date");
  const now = new Date();
  dateDiv.textContent = now.toLocaleString(); // You can customize this format

  // Build and append
  msgDiv.appendChild(senderDiv);
  msgDiv.appendChild(contentDiv);
  msgDiv.appendChild(dateDiv);
  container.appendChild(msgDiv);

  // Auto-scroll to bottom
  container.scrollTop = container.scrollHeight;
}


function showTypingIndicator(msg) {
  console.log("called ->>--------->>");

  const typingElem = document.getElementById("typing-indicator");
  if (!typingElem) return;
  console.log(typingElem);

  if (!appState.chat_user || msg.sender != appState.chat_user.id) {
    return
  }
  typingElem.innerText = `User ${appState.chat_user.nick_name} is typing...`;
  typingElem.style.display = "block";
}

function hideTypingIndicator() {
  const typingElem = document.getElementById("typing-indicator");
  if (!typingElem) return;
  typingElem.style.display = "none";
}
