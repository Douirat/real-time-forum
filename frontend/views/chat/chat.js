import { render_char_area } from "../../components/chat_area.js";
import { appState } from "../../utils/state.js";
import { render_error_page } from "../error.js";
import { load_users, setupUserScrollListener } from "../users/users.js";
import { sendMessage, worker } from "./worker.js";

let isTyping = false;
let time_out = null;

export function start_chat_with_user(user) {
  worker.port.start();

  // Check if there's an open chat with the same user
  const existingChat = document.querySelector("#chat_area");
  if (existingChat && appState.chat_user && appState.chat_user.id === user.id) {
    // If chat is already open with the same user, do nothing
    console.log("Chat is already open with this user");
    return;
  }

  // Remove existing chat only if it's with a different user
  if (existingChat) {
    existingChat.remove();
  }

  // Mark messages as read immediately
  sendMessage(worker, { type: "read", sender: user.id });

  // Remove notification from user interface
  const userElem = document.querySelector(`.user_chat[user-id='${user.id}']`);
  if (userElem) {
    const notif = userElem.querySelector(".notification");
    if (notif) {
      notif.textContent = "";
      notif.classList.remove("show");
      notif.classList.add("hidden");
    }
  }

  // Create new chat area - تم تمرير اسم المستخدم كمعامل
  const temp = document.createElement("div");
  temp.innerHTML = render_char_area(user.nick_name);
  const element = temp.firstElementChild;
  document.body.appendChild(element);

  // Reset chat settings
  appState.chat_offset = 0;
  appState.chat_user = user;

  get_chat_history(user);
  setupChatScrollListener();
  handle_messsage(); // تم إزالة معامل user من هنا
  handle_typing();   // تم إزالة معامل user من هنا
  cancel_chat();
}

// تم إزالة معامل user لأن الدالة تستخدم appState.chat_user
function handle_messsage() {
  const users_container = document.querySelector("#chat_users");
  let sendBtn = document.getElementById("send-button");
  let inputField = document.getElementById("message-input");

  sendBtn.addEventListener("click", () => {
    let input = inputField.value.trim();
    if (input === "") return;
    
    // التحقق من وجود المستخدم المفتوح في المحادثة
    if (!appState.chat_user) {
      console.error("No active chat user");
      return;
    }
    
    console.log("worker: ", worker);
    let message = {
      type: "message",
      receiver: appState.chat_user.id, // استخدام appState.chat_user.id بدلاً من user.id
      content: input,
    };

    let sent_message = {
      type: "sent_message",
      receiver: appState.chat_user.id, // استخدام appState.chat_user.id بدلاً من user.id
      content: input,
    };

    sendMessage(worker, sent_message);
    sendMessage(worker, message);
    appState.users_offset = 0;
    if (users_container) {
      users_container.innerHTML = "";
    }
    setupUserScrollListener();
    load_users();
    inputField.value = "";
  });
}

// تم إزالة معامل user لأن الدالة تستخدم appState.chat_user
function handle_typing() {
  let input_field = document.getElementById("message-input");
  input_field.addEventListener("input", () => {
    // التحقق من وجود المستخدم المفتوح في المحادثة
    if (!appState.chat_user) {
      return;
    }
    
    if (!isTyping) {
      sendMessage(worker, {
        type: "start_typing",
        receiver: appState.chat_user.id, // استخدام appState.chat_user.id بدلاً من user.id
        content: "typing_status",
      });
      isTyping = true;
    }

    clearTimeout(time_out);

    time_out = setTimeout(() => {
      if (isTyping) {
        sendMessage(worker, {
          type: "stop_typing",
          receiver: appState.chat_user.id, // استخدام appState.chat_user.id بدلاً من user.id
          content: "typing_status",
        });
        isTyping = false;
      }
    }, 1500);
  });
}

export function setupChatScrollListener() {
  const container = document.getElementById("messages-container");
  if (!container) return;

  container.addEventListener("scroll", () => {
    // Load more messages if scrolled to top and not already fetching
    if (container.scrollTop === 0 && !appState.is_fetching_messages) {
      get_chat_history(appState.chat_user);
    }
  });
}

// get chat history:
function get_chat_history(user) {
  if (appState.is_fetching_messages) return;
  appState.is_fetching_messages = true;
  appState.chat_user = user;

  fetch(
    `http://localhost:8080/get_chat?user_id=${user.id}&offset=${appState.chat_offset}&limit=${appState.chat_limit}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }
      return response.json();
    })
    .then((data) => {
      const container = document.getElementById("messages-container");
      if (!container || !data || data.length === 0) {
        appState.is_fetching_messages = false;
        return;
      }

      // If this is the first load of the chat (offset = 0), clear the container first
      if (appState.chat_offset === 0) {
        container.innerHTML = "";
      }

      const previousScrollHeight = container.scrollHeight;
      data = data.reverse();
      if (appState.chat_offset !== 0) {
        data = data.reverse();
      }
      data.forEach((msg) => {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message");
        msgDiv.classList.add(msg.sender_id === user.id ? "received" : "sent");

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("content");
        contentDiv.textContent = msg.content;

        const userDiv = document.createElement("div");
        userDiv.classList.add("message_creator");
        userDiv.textContent =
          msg.sender_id === user.id
            ? user.nick_name
            : appState.app_user?.nick_name || "You";

        const dateDiv = document.createElement("div");
        dateDiv.classList.add("message_date");
        const dateObj = new Date(msg.created_at);
        dateDiv.textContent = dateObj.toLocaleString();

        msgDiv.appendChild(userDiv);
        msgDiv.appendChild(contentDiv);
        msgDiv.appendChild(dateDiv);

        // If it's the first load, append at the end, otherwise insert at the beginning
        if (appState.chat_offset === 0) {
          container.appendChild(msgDiv);
        } else {
          container.insertBefore(msgDiv, container.firstChild);
        }
      });

      appState.chat_offset += data.length;

      // Manage scroll position
      if (appState.chat_offset === data.length) {
        // First load - scroll to bottom
        container.scrollTop = container.scrollHeight;
      } else {
        // Load more - maintain position
        container.scrollTop = container.scrollHeight - previousScrollHeight;
      }

      appState.is_fetching_messages = false;
    })
    .catch((error) => {
      appState.is_fetching_messages = false;
      // console.error("Error fetching chat history:", error);
      if (error.status) {
        render_error_page(error.status, getErrorMessage(error.status));
      } else {
        render_error_page(500, "failed to get chat history!");
      }
    });
}

// Cancel the chat area:
function cancel_chat() {
  let btn = document.getElementById("cancel_chat");
  btn.addEventListener("click", () => {
    appState.chat_user = null;
    btn.parentElement.parentElement.parentElement.remove();
  });
}

export function mark_messages_as_read(fromId) {
  fetch(`http://localhost:8080/mark_read?from_id=${fromId}`, {
    method: "POST",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to mark messages as read");
      return res.json();
    })
    .then((data) => {
      console.log("Messages marked as read:", data);
      const userChat = document.querySelector(
        `.user_chat[user-id='${fromId}']`
      );
      if (userChat) {
        const notification = userChat.querySelector(".notification");
        if (notification) {
          notification.textContent = "";
          notification.classList.remove("show");
          notification.classList.add("hidden");
        }
      }
    })
    .catch((err) => {
      console.error("Error marking messages as read:", err);
      if (err.status) {
        render_error_page(err.status, getErrorMessage(err.status));
      } else {
        render_error_page(500, "error marking messages as read!");
      }
    });
}