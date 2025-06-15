export function render_left_aside() {
    return /*html*/`
        <div id="chat_area" >
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
                        <input type="text" id="message-input" placeholder="Select a user to chat...">
                        <button id="send-button">Send</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
