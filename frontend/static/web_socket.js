import { handleIncomingMessage } from "./components/left_aside.js";
import { updateUserStatus } from "./components/right_aside.js";

// Global WebSocket connection
let globalSocket = null;

// Establish the WebSocket connection
export function create_web_socket() {
    const socket = new WebSocket("ws://localhost:8080/ws");
    globalSocket = socket;
    socket.onopen = function () {
        console.log("WebSocket connection established");
        // Send username to server when connection opens
        socket.send(JSON.stringify({
            type: "online",
        }));
    };

    socket.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            console.log("Received WebSocket message:", data);

            switch (data.type) {
                case "message":
                    console.log(`[${data.from}] says: ${data.content}`);
                    handleIncomingMessage(data);
                    break;
                case "online":
                    console.log(`User ${data.user_id} is now online`);
                    updateUserStatus(data.user_id, true);
                    break;

                case "offline":
                    console.log(`User ${data.user_id} is now offline`);
                    updateUserStatus(data.user_id, false);
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
export function sendMessage(socket, message) {
    try {
        socket.send(JSON.stringify(message));
        return true;
    } catch (error) {
        console.error("Error sending message:", error);
        return false;
    }
}
