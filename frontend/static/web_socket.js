// todo // establish the first websocket handshake to upgrade to full duplex communication:
export function create_web_socket() {
    const socket = new WebSocket("ws://localhost:8080/ws")
    socket.onopen = function () {
        console.log("connected to server");
        socket.onopen = function () {
            console.log("Connected to server");
            // Register user
            socket.send(JSON.stringify({
                type: "register",
                username: username
            }));
        };
    }

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
            console.log(`[${data.from}] says: ${data.content}`);
        } else {
            console.log("Server:", data);
        }
    }

    socket.onclose = function () {
        console.log("Connection closed");
    };

    socket.onerror = function (error) {
        console.error("Error occurred:", error);
    };
    return socket
}

// Send a message to another user:
function sendMessage(to, message) {
    socket.send(JSON.stringify({
        type: "message",
        to: to,
        content: message
    }));
}
