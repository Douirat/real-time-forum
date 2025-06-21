import { navigateTo } from "../router/router.js";
import { isValidEmail } from "../utils/auth_validators.js";
import { render_error_page } from "./error.js";
import { getErrorMessage } from "../utils/error_validators.js";

export async function login_user() {
    let credentials = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
    };

    if (!isValidEmail(credentials.email) || credentials.email === "" || credentials.password === "") {
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
                    alert("Login failed. Please check your credentials.");
                } else {
                    render_error_page(error.status, getErrorMessage(error.status));
                }
            } else {
                render_error_page(500, "Login failed due to an unknown error");
            }
        });
}