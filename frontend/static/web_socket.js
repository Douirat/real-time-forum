// MyWebSocketClient.js
export class MyWebSocketClient {
    constructor() {
        this.socket = null;
    }

    createWebSocket() {
        this.socket = new window.WebSocket("ws://localhost:8080/ws");

        this.socket.onopen = () => {
            console.log("Connected to server");
            this.socket.send(JSON.stringify({
                type: "register",
            }));
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "message") {
                console.log(`[${data.sender}] says: ${data.content}`);
            } else if (data.type === "live") {
                let user_chat = document.getElementById(`${data.sender}`);
                let live_notification = user_chat.getElementsByClassName("offline");

                if (live_notification.length > 0) {
                    live_notification[0].classList.replace("offline", "live");
                }

                console.log(user_chat);

            } else {
                console.log("happened ....");
                console.log("Server:", data);
            }
        };

        this.socket.onclose = () => {
            console.log("Connection closed");
        };

        this.socket.onerror = (error) => {
            console.error("Error occurred:", error);
        };
    }

    sendMessage(receiver, message) {
        if (this.socket && this.socket.readyState === this.socket.OPEN) {
            this.socket.send(JSON.stringify({
                type: "message",
                receiver: receiver,
                content: message
            }));
        } else {
            console.warn("Cannot send message, socket not open");
        }
    }
}
