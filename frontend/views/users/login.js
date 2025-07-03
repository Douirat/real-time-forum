import { navigateTo } from "../../router/router.js";
import { isValidEmail } from "../../utils/auth_validators.js";
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";

// Function to show error notification
function showErrorNotification(message) {
    // Remove existing error notification if any
    const existingError = document.querySelector('.error-notification');
    if (existingError) {
        existingError.remove();
    }

    // Create error notification element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-notification';
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
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Insert error notification at the top of the form
    const form = document.getElementById('login_form');
    if (form) {
        form.insertBefore(errorElement, form.firstChild);
    }
}

export async function login_user() {
    let credentials = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
    };

    if (!isValidEmail(credentials.email) || credentials.email === "" || credentials.password === "") {
        showErrorNotification("Invalid email or password");
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
                const error = new Error(errorText);
                error.status = response.status;
                throw error;
            }
            return response.json();
        })
        .then((data) => navigateTo("/"))
        .catch((error) => {
            console.error("Login error:", error);

            // Handle specific HTTP errors
            if (error.status) {
                if (error.status === 401 || error.status === 403) {
                    showErrorNotification("Login failed. Please check your credentials.");
                } else {
                    render_error_page(error.status, getErrorMessage(error.status));
                }
            } else {
                render_error_page(500, "Login failed due to an unknown error");
            }
        });
}