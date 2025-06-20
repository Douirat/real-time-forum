import { render_char_area } from "./components/chat_area.js";
import { sendMessage, worker } from "./worker.js";

let isTyping = false
let time_out = null

export function start_chat_with_user(user_id) {
     worker.port.start()
  // Remove existing chat box if present
  let oldChat = document.querySelector("#chat_area");
  if (oldChat) oldChat.remove();

  const temp = document.createElement('div');
  temp.innerHTML = render_char_area();
  const element = temp.firstElementChild;
  document.body.appendChild(element);
  get_chat_history(user_id)
  handle_messsage(user_id);
  handle_typing(user_id);
  cancel_chat();
}


function handle_messsage(user_id) {
 
  let sendBtn = document.getElementById("send-button");
  let inputField = document.getElementById("message-input");
  

  sendBtn.addEventListener("click", () => {
    let input = inputField.value.trim();
    if (input === "") return;
    console.log("worker: ", worker);
    let message = {
      type: "message",
      receiver: user_id,
      content: input
    }
   
    sendMessage(worker, message);
    display_sent_message(message)

    inputField.value = "";
  });
}


// handle sending the typing notification:
function handle_typing(user_id) {
  let input_field = document.getElementById("message-input");
  input_field.addEventListener("input", () => {
    if (!isTyping) {
      sendMessage(worker, {
        type: "start_typing",
        receiver: user_id,
        content: "typing_status"
      });
      isTyping = true;
    }

    clearTimeout(time_out); 

    time_out = setTimeout(() => {
      if (isTyping) {
        sendMessage(worker, {
          type: "stop_typing",
          receiver: user_id,
          content: "typing_status"
        });
        isTyping = false;
      }
    }, 1500);
  });
}

// get chat history:
function get_chat_history(user_id) {
  fetch(`http://localhost:8080/get_chat?user_id=${user_id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }
      return response.json();
    })
    .then(data => {
      const container = document.getElementById("messages-container");
      container.innerHTML = ""; // clear previous messages

      data.forEach(msg => {
        const msgDiv = document.createElement("div");

        msgDiv.classList.add("message");
        msgDiv.classList.add(msg.sender_id === user_id ? "received" : "sent");

        msgDiv.innerText = msg.content;
        container.appendChild(msgDiv);
      });

      // Auto-scroll to bottom
      container.scrollTop = container.scrollHeight;
    })
    .catch(error => {
      console.error("Error fetching chat history:", error);
    });
}



// Cancel the chat area:
function cancel_chat() {
  let btn = document.getElementById("cancel_chat")
  btn.addEventListener("click", () => {
    btn.parentElement.parentElement.parentElement.remove()
  })
}

 function display_sent_message(message) {
  const container = document.getElementById("messages-container");
  if (!container) return;
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", "sent");
  msgDiv.innerText = message.content;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
 }