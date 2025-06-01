import { create_web_socket, sendMessage, getCurrentSocket } from "../web_socket.js";

export function render_left_aside() {
    return /*html*/`
        <aside id="left_aside" class="left">
            <div id="chat-container" class="chat-container">
                <div class="chat-header">
                    <h3>Chat</h3>
                    <div id="current-chat-user">Select a user to chat with</div>
                </div>
                <div class="chat-area">
                    <div id="messages-container" class="messages-container">
                        <!-- Messages will appear here -->
                    </div>
                    <div class="message-input-container">
                        <input type="text" id="message-input" placeholder="Select a user to chat..." disabled>
                        <button id="send-button" disabled>Send</button>
                    </div>
                </div>
            </div>
        </aside>
    `;
}

let currentChatUserId = null;

export function init_chat() {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    
    if (sendButton) {
        sendButton.addEventListener("click", sendCurrentMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendCurrentMessage();
            }
        });
    }
}

export function startChatWithUser(user) {
    if (!user || !user.id) {
        console.error("Invalid user data");
        return;
    }

    currentChatUserId = user.id;

    const chatUserElement = document.getElementById("current-chat-user");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");

    if (chatUserElement) {
        chatUserElement.textContent = `Chatting with: ${user.nick_name || "Unknown User"}`;
    }

    if (messageInput && sendButton) {
        messageInput.disabled = false;
        messageInput.placeholder = "Type a message...";
        sendButton.disabled = false;
    }

    fetchChatHistory(user.id);
}

function fetchChatHistory(userId) {
    fetch(`http://localhost:8080/get_chat?user_id=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(messages => {
            displayMessages(messages, userId);
        })
        .catch(error => {
            console.error('Error fetching chat:', error);
            displayError("Failed to load chat history");
        });
}

function displayMessages(messages, userId) {
    const messagesContainer = document.getElementById("messages-container");
    if (!messagesContainer) return;

    messagesContainer.innerHTML = "";

    if (Array.isArray(messages)) {
        messages.forEach(message => {
            const isCurrentUser = message.sender_id == userId;
            addMessageToUI(
                message.content, 
                isCurrentUser ? "received" : "sent",
                isCurrentUser ? (message.sender_name || "User") : "You"
            );
        });
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessageToUI(content, type = "received", senderName = "") {
    const messagesContainer = document.getElementById("messages-container");
    if (!messagesContainer) return;

    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;
    
    const senderElement = document.createElement("span");
    senderElement.className = "sender";
    senderElement.textContent = senderName + ": ";
    messageElement.appendChild(senderElement);
    
    const contentElement = document.createElement("span");
    contentElement.className = "content";
    contentElement.textContent = content;
    messageElement.appendChild(contentElement);
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendCurrentMessage() {
    const messageInput = document.getElementById("message-input");
    if (!messageInput) return;
    
    const content = messageInput.value.trim();
    if (!content || !currentChatUserId) return;

    const socket = getCurrentSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error("WebSocket not connected");
        displayError("Connection lost. Please refresh the page.");
        return;
    }

    addMessageToUI(content, "sent", "You");
    messageInput.value = "";

    sendMessage(socket, currentChatUserId, content);
}

function displayError(message) {
    const messagesContainer = document.getElementById("messages-container");
    if (!messagesContainer) return;

    const errorElement = document.createElement("div");
    errorElement.className = "error";
    errorElement.textContent = message;
    messagesContainer.appendChild(errorElement);
}

export function handleIncomingMessage(data) {
    if (currentChatUserId && data.from == currentChatUserId) {
        addMessageToUI(data.content, "received", data.from_name || "User");
    }
}