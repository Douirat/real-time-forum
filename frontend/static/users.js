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
  console.log("All users: ", users);
  
  const onlineContainer = document.querySelector("#online-users-list");
  const offlineContainer = document.querySelector("#offline-users-list");
  if (!onlineContainer || !offlineContainer) return;

  // Clear previous users
  onlineContainer.innerHTML = "";
  offlineContainer.innerHTML = "";

  users.forEach(user => {
    console.log("the chat user: ", user);

    // Create user chat div
    const userChat = document.createElement("div");
    userChat.classList.add("user_chat");
    userChat.setAttribute("data-user-id", user.id);
    userChat.setAttribute("role", "button");
    userChat.setAttribute("tabindex", "0");

    // Status indicator
    const status = document.createElement("div");
    status.classList.add("user_status");
    if (user.is_online) {
      status.classList.add("online");
      status.setAttribute("aria-label", "Online");
      status.title = "Online";
    } else {
      status.classList.add("offline");
      status.setAttribute("aria-label", "Offline");
      status.title = "Offline";
    }

    // User name
    const userName = document.createElement("p");
    userName.textContent = user.nick_name || "Anonymous";

    userChat.append(status, userName);

    // Click handler
    userChat.addEventListener("click", () => {
      start_chat_with_user(user);
    });

    // Keyboard accessibility: trigger click on Enter or Space
    userChat.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        start_chat_with_user(user);
      }
    });

    // Append user to the correct container
    if (user.is_online) {
      onlineContainer.appendChild(userChat);
    } else {
      offlineContainer.appendChild(userChat);
    }
  });
}





export function setupUserScrollListener() {
  const box = document.querySelector("#users-scroll-box");
  if (!box) return;

  function handleUserScroll() {
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 10 && !isFetchingUsers) {
      load_users();
    }
  }

  box.addEventListener("scroll", handleUserScroll);
  return { box, handleUserScroll };
}

export function load_users() {
  isFetchingUsers = true;
  fetch(`http://localhost:8080/get_users?offset=${appState.users_offset}&limit=${appState.users_limit}`)
    .then(response => response.json())
    .then(data => {
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
    })
    .finally(() => {
      isFetchingUsers = false;
    });
}




