import {create_web_socket, sendMessage } from "../web_socket.js"

export function render_left_aside(web_socket) {
  return /*html*/`
<aside id="left_aside" class="left">
   <!-- Chat Container -->
 <div id="chat-container" class="chat-container">
            <div class="chat-header">
            </div>
            <div class="chat-area">
                <div class="users-list" id="users-list">
                    <h4>Users</h4>
                    <!-- Users will be dynamically added here -->
                </div>
                <div id="message-area">
                    </div>
                </div>
            </div>
        </div>
    </div>
    </aside>
    `
}


// Create a function to fil the left asside with other users to chat with:
export function display_chat_users() {
  let left_side = document.getElementById("users-list")
  let friends_container = document.createElement("div")
  friends_container.setAttribute("id", "friends_container")
  const offset = 0;
  const limit = 10;

  fetch(`http://localhost:8080/get_users?offset=${offset}&limit=${limit}`)
    .then(res => res.json())
    .then(data => {
      console.log(data)
      data.forEach(user => {
        let chat = document.createElement("div")
        chat.setAttribute("id", user.id)
        chat.setAttribute("class", "user_chat")
        let live_flag = document.createElement("div")
        live_flag.setAttribute("id", "live_flag")
        let live_user = document.createElement("small")
        live_user.textContent = user.nick_name
        chat.append(live_flag, live_user)
        chat.addEventListener("click", () => {
          console.log("I want to chat with this user: ", user.nick_name);
          create_chat_room(user)
        })
        friends_container.appendChild(chat)
      })
      left_side.appendChild(friends_container)
    })
    .catch(err => console.error(err));
}

// Create a chat room between tow users:
function create_chat_room(user = {}) {
  let socket = create_web_socket(user.nick_name)
  // Bring all the messages between tow clints:
  fetch(`http://localhost:8080/get_chat?user_id=${user.id}`)
    .then(function (response) {
      return response.json(); // Convert the response to JSON
    })
    .then(function (data) {
      console.log(data); // Handle the data received from the API
      // Find the parent container where you want to insert the chat UI
      const container = document.getElementById("message-area");

      // Clear any existing content if needed
      container.innerHTML = "";

      // Create the messages container div
      const messagesDiv = document.createElement("div");
      messagesDiv.className = "messages";
      messagesDiv.id = "messages";

      // Create the message input container
      const inputDiv = document.createElement("div");
      inputDiv.className = "message-input";

      // Create the text input
      const input = document.createElement("input");
      input.type = "text";
      input.id = "message-input";
      input.placeholder = "Type a message...";

      // Create the send button
      const sendButton = document.createElement("button");
      sendButton.id = "send-button";
      sendButton.textContent = "Send";

      sendButton.addEventListener("click", () => {
        let content = document.getElementById("message-input").value
        if (content === "") {
          return
        }
        console.log("The client wants to chat with: ", user.id);
        sendMessage(socket, user.nick_name, content)
      })

      // Append input and button to the inputDiv
      inputDiv.appendChild(input);
      inputDiv.appendChild(sendButton);

      // Append messages div and input div to the container
      container.appendChild(messagesDiv);
      container.appendChild(inputDiv);

      setTimeout(() => {
        let message_area = document.getElementById("messages");
        if (data) {
          data.forEach(message => {
            let message_container = document.createElement("div");
            message_container.setAttribute("class", "message_container"); // fixed typo here
            let text = document.createElement("p");
            text.setAttribute("class", "comment_content");
            text.textContent = message.content;
            message_container.appendChild(text);
            message_area.appendChild(message_container);
          });
        }
      }, 0);

    })
    .catch(function (error) {
      console.error('Error fetching:', error); // Handle errors
    });
}