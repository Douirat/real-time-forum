import { navigateTo } from "../router/router.js";
import { isValidEmail } from "../utils/auth_validators.js";

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
            return response.json();
        })
        .then((data) => navigateTo("/"))
        .catch((errorText) => {
            console.log("Error:", errorText);
            alert("Login failed. Please check your credentials.");
        });
}