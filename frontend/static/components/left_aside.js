import { create_web_socket, sendMessage, getCurrentSocket, markMessagesAsRead } from "../web_socket.js";

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

let currentChatUserId = null
let currentUserId = null

export function init_chat() {
    const messageInput = document.getElementById("message-input")
    const sendButton = document.getElementById("send-button")
    
    // Get current user ID from somewhere (session, API call, etc.)
    getCurrentUserId();
    
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

// Function to get current user ID - adjust based on your authentication system
function getCurrentUserId() {
    // You might get this from a session API or stored user data
    fetch('/api/current-user') // Adjust this endpoint as needed
        .then(response => response.json())
        .then(data => {
            currentUserId = data.user_id
        })
        .catch(error => {
            console.error('Error getting current user ID:', error)
            // You might have the user ID stored elsewhere, adjust as needed
        })
}

export function startChatWithUser(user_id) {
    if (!user.id === 0) {
        console.error("Invalid user data");
        return;
    }



    const chatUserElement = document.getElementById("current-chat-user");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");

    if (chatUserElement) {
        chatUserElement.textContent = `Chatting with: ${user.nick_name || "Unknown User"}`;
    }

    if (messageInput && sendButton) {
        messageInput.disabled = false
        messageInput.placeholder = "Type a message..."
        sendButton.disabled = false
    }

    // Mark messages as read when starting chat with this user
    // This should ONLY mark messages FROM the other user TO current user as read
    const socket = getCurrentSocket()
    if (socket && socket.readyState === WebSocket.OPEN) {
        markMessagesAsRead(socket, user.id)
    } else {
        console.warn("WebSocket not connected, cannot mark messages as read")
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
            // Fix the logic here - check who sent the message
            const isFromCurrentUser = message.sender_id == currentUserId;
            addMessageToUI(
                message.content, 
                isFromCurrentUser ? "sent" : "received",
                isFromCurrentUser ? "You" : (message.sender_name || "User")
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

    // Add message to UI immediately for better UX
    addMessageToUI(content, "sent", "You");
    messageInput.value = "";

    // Send the message via WebSocket
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
    // Only handle messages if we're currently chatting with the sender
    if (currentChatUserId && data.from == currentChatUserId) {
        // Only add to UI if this is NOT our own message being echoed back
        if (data.from != currentUserId) {
            addMessageToUI(data.content, "received", data.from_name || "User");
            
            // ONLY mark as read if the message is FROM the other user TO us
            // and we're currently viewing their conversation
            const socket = getCurrentSocket();
            if (socket && socket.readyState === WebSocket.OPEN) {
                markMessagesAsRead(socket, data.from);
            }
        }
    }
}