import { render_char_area } from "./components/chat_area.js";
import { navigateTo } from "./script.js";
import { start_chat_with_user } from "./chat.js"
import { worker, sendMessage } from "./worker.js";

// users offset and limit:
let users_offset = 0
let users_limit = 10
let isFetchingUsers = false;

export async function register_new_user() {
  let user = {
    id: 0,
    first_name: document.getElementById("first_name").value.trim(),
    last_name: document.getElementById("last_name").value.trim(),
    age: generate_age(document.getElementById("birth_date").value),
    email: document.getElementById("email").value.trim(),
    gender: document.querySelector("input[name='gender']:checked").value,
    password: document.getElementById("password").value,
    confirmation: document.getElementById("confirmation").value,
    nick_name: "-",
  };
  if (
    !isValidPassword(user.password, user.confirmation) ||
    !isValidEmail(user.email)
  ) {
    alert("invalid email or password");
    return;
  }

  fetch("http://localhost:8080/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    })
    .then((data) => navigateTo("/login"))
    .catch((errorText) => console.log("Error:", errorText));
}

// Handle user login:
export async function login_user() {
  let credentials = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  };

  if (
    !isValidEmail(credentials.email) ||
    credentials.email === "" ||
    credentials.password === ""
  ) {
    alert("invalid email or password");
    return;
  }
  fetch("http://localhost:8080/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      navigateTo("/");
      return response.json();
    })
    .then((data) => navigateTo("/"))
    .catch((errorText) => console.log("Error:", errorText));
}

// Generate age:
let generate_age = (born) => {
  let birth_date = new Date(born);
  let current_date = new Date();
  let age = current_date.getFullYear() - birth_date.getFullYear();
  return age;
};

// Is valid password:
let isValidPassword = (password, confirmation) => {
  return password === confirmation && password.length >= 8;
};

// is valid email:
function isValidEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// logout logic
export function logout() {
  let btn = document.querySelector('.logout')
  btn.addEventListener('click', () => {
    fetch("http://localhost:8080/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
    })
      .then(async response => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }
        worker.port.start()
        sendMessage(worker, { type: "logout" })
        navigateTo("/login")
        return response.json();
      })
      .then(data => () => {
        // console.log(data)
      })
      .catch(errorText => console.log("Error:", errorText));
  })
}


function renderUsers(users) {
  const container = document.querySelector("#users-list");
  container.innerHTML = ""
  users.forEach(user => {
    console.log("the chat user: ", user);
    let user_chat = document.createElement("div")
    user_chat.classList.add("user_chat")
    user_chat.setAttribute("id", user.id)
    const status = document.createElement("div")
    status.setAttribute("id", "user_status");
    status.classList.add("offline")
    let user_name = document.createElement("p")
    user_name.innerText = user.nick_name;
    user_chat.append(status, user_name)

    user_chat.addEventListener("click", () => {
      start_chat_with_user(user.id)
    })
    container.appendChild(user_chat)
  });
}




export function setupUserScrollListener() {
  const box = document.querySelector("#users-scroll-box");
  box.addEventListener("scroll", () => {
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 10 && !isFetchingUsers) {
      loadMoreUsers();
    }
  });
}

export function load_users() {
  isFetchingUsers = true;
  fetch(`http://localhost:8080/get_users?offset=${users_offset}&limit=${users_limit}`)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        renderUsers(data);
        users_offset += data.length;
      } else {
        // No more users, remove scroll listener if needed
        const box = document.querySelector("#users-scroll-box");
        box.removeEventListener("scroll", handleUserScroll);
      }
    })
    .finally(() => {
      isFetchingUsers = false;
    });
}
