// Render chat area:
export function render_chat_area() {
    return /*HTML*/`
 <!-- Chat Container -->
 <div id="chat-container" class="chat-container">
            <div class="chat-header">
            </div>
            <div class="chat-area">
                <div class="users-list" id="users-list">
                    <h3>Users</h3>
                    <!-- Users will be dynamically added here -->
                </div>
                <div class="message-area">
                    <div class="messages" id="messages">
                        <!-- Messages will be dynamically added here -->
                    </div>
                    <div class="message-input">
                        <input type="text" id="message-input" placeholder="Type a message...">
                        <button id="send-button">Send</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`
}