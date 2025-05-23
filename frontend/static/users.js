import { navigateTo } from "./script.js";

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
