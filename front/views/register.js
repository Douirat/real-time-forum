import { navigateTo } from "../router/router.js";
import { generate_age, isValidPassword, isValidEmail } from "../utils/auth_validators.js";
import { render_error_page } from "./error.js";
import { getErrorMessage } from "../utils/error_validators.js";

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

    if (!isValidPassword(user.password, user.confirmation) || !isValidEmail(user.email)) {
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
                    alert("Registration failed. Please check your information.");
                } else {
                    render_error_page(error.status, getErrorMessage(error.status));
                }
            } else {
                render_error_page(500, "Registration failed due to an unknown error");
            }
        });
}