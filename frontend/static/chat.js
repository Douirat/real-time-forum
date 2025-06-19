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
   
    sendMessage(worker, {
      type: "message",
      receiver: user_id,
      content: input
    });

    inputField.value = "";
  });
}


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

function cancel_chat() {
  let btn = document.getElementById("cancel_chat")
  btn.addEventListener("click", () => {
    btn.parentElement.parentElement.parentElement.remove()
  })
}