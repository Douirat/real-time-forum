export function render_char_area() {
  return /*html*/`
    <div id="chat_area">
      <div class="chat-container">
        <div class="chat-header">
          <h3>Chat</h3>
          <button id="cancel_chat">x</button>
        </div>

        <div id="messages-container" class="messages-container">
          <!-- Messages will appear here -->
        </div>

        <!-- Typing indicator placeholder -->
        <div id="typing-indicator" class="typing-indicator"></div>

        <div class="message-input-container">
          <input type="text" id="message-input" placeholder="Type a message..." />
          <button id="send-button">Send</button>
        </div>
      </div>
    </div>
  `;
}
