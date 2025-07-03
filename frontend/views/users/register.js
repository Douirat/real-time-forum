import { navigateTo } from "../../router/router.js";
import {
  generate_age,
  isValidPassword,
  isValidEmail,
} from "../../utils/auth_validators.js";
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";

// Function to show error notification
function showErrorNotification(message) {
  // Remove existing error notification if any
  const existingError = document.querySelector(".error-notification");
  if (existingError) {
    existingError.remove();
  }

  // Create error notification element
  const errorElement = document.createElement("div");
  errorElement.className = "error-notification";
  errorElement.textContent = message;
  errorElement.style.cssText = `
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 10px;
        margin: 10px 0;
        font-size: 14px;
        text-align: center;
        animation: slideIn 0.3s ease-out;
    `;

  // Add slide-in animation
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
  document.head.appendChild(style);

  // Insert error notification at the top of the form
  const form = document.getElementById("registration_form");
  if (form) {
    form.insertBefore(errorElement, form.firstChild);
  }
}

export async function register_new_user() {
  let user = {
    id: 0,
    first_name: document.getElementById("first_name").value.trim(),
    last_name: document.getElementById("last_name").value.trim(),
    age: generate_age(document.getElementById("birth_date").value),
    email: document.getElementById("email").value.trim(),
    gender: document.querySelector("input[name='gender']:checked")?.value,
    password: document.getElementById("password").value,
    confirmation: document.getElementById("confirmation").value,
    nick_name: "-",
  };
  if (user.age < 18) {
    showErrorNotification("You must be at least 18 years old to register");
    return;
  }
  if (
    !isValidPassword(user.password, user.confirmation) ||
    !isValidEmail(user.email)
  ) {
    showErrorNotification("Invalid email or password");
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
        const error = new Error(errorText);
        error.status = response.status;
        throw error;
      }
      return response.json();
    })
    .then((data) => navigateTo("/login"))
    .catch((error) => {
      console.error("Registration error:", error);

      // Handle specific HTTP errors
      if (error.status) {
        if (error.status === 400 || error.status === 403) {
          showErrorNotification(
            "Registration failed. Please check your information."
          );
        } else {
          render_error_page(error.status, getErrorMessage(error.status));
        }
      } else {
        render_error_page(500, "Registration failed due to an unknown error");
      }
    });
}
