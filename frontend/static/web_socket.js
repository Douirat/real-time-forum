import { handleIncomingMessage } from "./components/left_aside.js";

// Global WebSocket connection
let globalSocket = null;

// Establish the WebSocket connection
export function create_web_socket(username) {
    // Close existing connection if any
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
        globalSocket.close();
    }

    const socket = new WebSocket("ws://localhost:8080/ws");
    globalSocket = socket;

    socket.onopen = function () {
        console.log("Connected to WebSocket server");
        // Register user
        socket.send(JSON.stringify({
            type: "register",
            username: username
        }));
    };

    socket.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            console.log("Received WebSocket message:", data);
            
            switch (data.type) {
                case "connected":
                    console.log("WebSocket connection confirmed:", data.message);
                    break;
                    
                case "registered":
                    console.log("User registration confirmed:", data.message);
                    break;
                    
                case "message":
                    console.log(`[${data.from}] says: ${data.content}`);
                    // Handle incoming message in the UI
                    handleIncomingMessage(data);
                    break;
                    
                case "sent":
                    console.log("Message sent confirmation:", data.message);
                    break;
                    
                case "error":
                    console.error("WebSocket error:", data.error);
                    alert("WebSocket error: " + data.error);
                    break;
                    
                default:
                    console.log("Unknown message type:", data);
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };

    socket.onclose = function (event) {
        console.log("WebSocket connection closed", event.code, event.reason);
        globalSocket = null;
    };

    socket.onerror = function (error) {
        console.error("WebSocket error occurred:", error);
    };

    return socket;
}

// Send a message to another user
export function sendMessage(socket, to, message) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not open. Ready state:", socket ? socket.readyState : "null");
        alert("Connection lost. Please refresh the page.");
        return false;
    }

    if (!to || !message.trim()) {
        console.error("Invalid message parameters:", { to, message });
        return false;
    }

    try {
        socket.send(JSON.stringify({
            type: "message",
            to: parseInt(to),
            content: message.trim()
        }));
        return true;
    } catch (error) {
        console.error("Error sending message:", error);
        return false;
    }
}

// Get current WebSocket connection
export function getCurrentSocket() {
    return globalSocket;
}

// Check if WebSocket is connected
export function isWebSocketConnected() {
    return globalSocket && globalSocket.readyState === WebSocket.OPEN;
}