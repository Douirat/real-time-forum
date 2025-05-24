import { create_web_socket, sendMessage } from "../web_socket.js"

export function render_left_aside(web_socket) {
  return /*html*/`
    <aside id="left_aside" class="left">
      <!-- Chat Container -->
      <div id="chat-container" class="chat-container">
        <div class="chat-header">
        </div>
        <div class="chat-area">
          <div class="users-list" id="users-list">
            <h4>Users</h4>
            <!-- Users will be dynamically added here -->
          </div>
          <div id="message-area">
          </div>
        </div>
      </div>
    </aside>
  `
}

// Create a function to fill the left aside with other users to chat with:
export function display_chat_users() {
  let left_side = document.getElementById("users-list")
  if (!left_side) {
    console.error("users-list element not found");
    return;
  }

  // Clear existing friends container if it exists
  const existingContainer = document.getElementById("friends_container");
  if (existingContainer) {
    existingContainer.remove();
  }

  let friends_container = document.createElement("div")
  friends_container.setAttribute("id", "friends_container")
  const offset = 0;
  const limit = 10;

  fetch(`http://localhost:8080/get_users?offset=${offset}&limit=${limit}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log(data)
      if (Array.isArray(data)) {
        data.forEach(user => {
          let chat = document.createElement("div")
          chat.setAttribute("id", `user_${user.id}`) // Make ID unique
          chat.setAttribute("class", "user_chat")
          
          let live_flag = document.createElement("div")
          live_flag.setAttribute("class", "live_flag") // Use class instead of id for repeated elements
          
          let live_user = document.createElement("small")
          live_user.textContent = user.nick_name || user.first_name || "Unknown User"
          
          chat.append(live_flag, live_user)
          chat.addEventListener("click", () => {
            console.log("I want to chat with this user: ", user.nick_name || user.first_name);
            create_chat_room(user)
          })
          friends_container.appendChild(chat)
        })
      }
      left_side.appendChild(friends_container)
    })
    .catch(err => {
      console.error("Error fetching users:", err);
    });
}

// Create a chat room between two users:
function create_chat_room(user = {}) {
  if (!user.id) {
    console.error("Invalid user data");
    return;
  }

  let socket = create_web_socket(user.nick_name || user.first_name)
  
  // Bring all the messages between two clients:
  fetch(`http://localhost:8080/get_chat?user_id=${user.id}`)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // Convert the response to JSON
    })
    .then(function (data) {
      console.log("Chat data:", data); // Handle the data received from the API
      
      // Find the parent container where you want to insert the chat UI
      const container = document.getElementById("message-area");
      if (!container) {
        console.error("message-area element not found");
        return;
      }

      // Clear any existing content
      container.innerHTML = "";

      // Create the messages container div
      const messagesDiv = document.createElement("div");
      messagesDiv.className = "messages";
      messagesDiv.id = "messages";

      // Create the message input container
      const inputDiv = document.createElement("div");
      inputDiv.className = "message-input";

      // Create the text input
      const input = document.createElement("input");
      input.type = "text";
      input.id = "message-input";
      input.placeholder = "Type a message...";

      // Create the send button
      const sendButton = document.createElement("button");
      sendButton.id = "send-button";
      sendButton.textContent = "Send";

      // Add send button event listener
      sendButton.addEventListener("click", () => {
        sendMessageHandler(socket, user.id);
      });

      // Add enter key listener to input
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendMessageHandler(socket, user.id);
        }
      });

      // Function to handle sending messages
      function sendMessageHandler(socket, userId) {
        const messageInput = document.getElementById("message-input");
        if (!messageInput) return;
        
        let content = messageInput.value.trim();
        if (content === "") {
          return;
        }
        
        console.log("The client wants to chat with: ", userId);
        sendMessage(socket, userId, content);
        
        // Clear the input after sending
        messageInput.value = "";
        
        // Add the message to the UI immediately (optimistic update)
        addMessageToUI(content, "sent");
      }

      // Append input and button to the inputDiv
      inputDiv.appendChild(input);
      inputDiv.appendChild(sendButton);

      // Append messages div and input div to the container
      container.appendChild(messagesDiv);
      container.appendChild(inputDiv);

      // Load existing messages
      loadExistingMessages(data);

    })
    .catch(function (error) {
      console.error('Error fetching chat:', error); // Handle errors
    });
}

// Function to load existing messages into the chat
function loadExistingMessages(data) {
  const message_area = document.getElementById("messages");
  if (!message_area) {
    console.error("Messages area not found");
    return;
  }

  if (data && Array.isArray(data)) {
    data.forEach(message => {
      addMessageToUI(message.content, "received", message.sender_name);
    });
  }
  
  // Scroll to bottom of messages
  message_area.scrollTop = message_area.scrollHeight;
}

// Function to add a message to the UI
function addMessageToUI(content, type = "received", senderName = "") {
  const message_area = document.getElementById("messages");
  if (!message_area) return;

  let message_container = document.createElement("div");
  message_container.setAttribute("class", `message_container ${type}`);
  
  if (senderName && type === "received") {
    let sender = document.createElement("span");
    sender.setAttribute("class", "sender_name");
    sender.textContent = senderName + ": ";
    message_container.appendChild(sender);
  }
  
  let text = document.createElement("p");
  text.setAttribute("class", "comment_content");
  text.textContent = content;
  
  message_container.appendChild(text);
  message_area.appendChild(message_container);
  
  // Scroll to bottom
  message_area.scrollTop = message_area.scrollHeight;
}

// Function to handle incoming WebSocket messages (call this from your WebSocket onmessage handler)
export function handleIncomingMessage(messageData) {
  addMessageToUI(messageData.content, "received", messageData.from);
}