export function render_char_area() {
    return /*html*/`
        <div id="chat_area" >
            <div id="chat-container" class="chat-container">
                <div class="chat-header">
                    <h3>Chat</h3>
                    <button id="cancel_chat">x</button>
                </div>
                <div class="chat-area">
                    <div id="messages-container" class="messages-container">
                        <!-- Messages will appear here -->
                    </div>
                    <div class="message-input-container">
                        <input type="text" id="message-input" placeholder="Select a user to chat...">
                        <button id="send-button">Send</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
