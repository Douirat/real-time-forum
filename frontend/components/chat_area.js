export function render_char_area(userName = "Chat") {
  return /*html*/`
    <div id="chat_area">
      <div class="chat-container">
        <div class="chat-header">
          <h3>${userName}</h3>
          <button id="cancel_chat"><img src="/assets/imgs/delete-button.png" alt="x"></button>
        </div>
        <div id="messages-container" class="messages-container">
          <!-- Messages will appear here -->
        </div>
        <!-- Typing indicator placeholder -->
        <div id="typing-indicator" class="typing-indicator"></div>

        <div class="message-input-container">
          <input type="text" id="message-input" placeholder="Type a message..." />
          <button id="send-button"><img src="/assets/imgs/send-message.png" alt="send"></button>
        </div>
      </div>
    </div>
  `;
}