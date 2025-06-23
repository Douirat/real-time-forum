import { navigateTo } from "./script.js";
import { start_chat_with_user } from "./chat.js"
import { worker, sendMessage } from "./worker.js";
import { appState } from "./state.js";


// users offset and limit:
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
  const users_container = document.querySelector("#chat_users");
  if (!users_container) return;

  // Clear previous users
  // users_container.innerHTML = "";

  users.forEach(user => {
    console.log("the chat user: ", user);

    // Create user chat div
    const user_chat = document.createElement("div");
    user_chat.classList.add("user_chat");
    user_chat.setAttribute("user-id", user.id);
    user_chat.tabIndex = 0; // for keyboard navigation

    // Status indicator
    const status = document.createElement("div");
    status.classList.add("user_status");
    if (user.is_online) {
      status.classList.add("online");
      status.title = "Online";
    } else {
      status.classList.add("offline");
      status.title = "Offline";
    }

    // User name
    const user_name = document.createElement("p");
    user_name.textContent = user.nick_name || "Anonymous";

    // Notification block
    const notification = document.createElement("div");
    notification.classList.add("notification");

    // Show unread count only if greater than 0
    if (user.unread_count && user.unread_count > 0) {
      notification.textContent = user.unread_count;
      notification.classList.add("show"); // Use for styling
    } else {
      notification.classList.add("hidden"); // Optional styling
    }

    // Assemble chat user block
    user_chat.append(status, user_name, notification);

    // Click handler
    user_chat.addEventListener("click", () => {
      start_chat_with_user(user);
    });

    // Keyboard accessibility
    user_chat.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        start_chat_with_user(user);
      }
    });

    users_container.appendChild(user_chat);
  });
}





export function load_users() {
  if (appState.is_fetching_users) return; // prevent concurrent fetches
  appState.is_fetching_users = true;
  console.log("The offset and limits are: ", appState.users_offset, " ", appState.users_limit);

  fetch(`http://localhost:8080/get_users?offset=${appState.users_offset}&limit=${appState.users_limit}`)
    .then(response => response.json())
    .then(data => {
      if (data) {
        if (data.length > 0) {
          renderUsers(data);
          appState.users_offset += data.length;
        } else {
          // No more users, remove scroll listener
          const box = document.querySelector("#users-scroll-box");
          if (box && window.userScrollHandler) {
            box.removeEventListener("scroll", window.userScrollHandler);
            console.log("Removed user scroll listener - no more users");
          }
        }
      }
    })
    .finally(() => {
      appState.is_fetching_users = false;
    });
}

export function setupUserScrollListener() {
  const box = document.querySelector("#users-scroll-box");
  if (!box) return;

  function handleUserScroll() {
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 10 && !appState.is_fetching_users) {
      load_users();
    }
  }

  box.addEventListener("scroll", handleUserScroll);
  window.userScrollHandler = handleUserScroll;

  return { box, handleUserScroll };
}





