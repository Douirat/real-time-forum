import { navigateTo } from '../router/router.js';

// Check if user is logged in
export function check_login() {
    return fetch("http://localhost:8080/is_logged", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        return response.json();
    })
    .catch(error => {
        console.log("Error checking login:", error.message);
        throw error;
    });
}

// Login user
export function login_user() {
    let credentials = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
    };

    if (credentials.email === "" || credentials.password === "") {
        alert("Please fill in all fields");
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
        .then((data) => {
            navigateTo("/");
        })
        .catch((errorText) => {
            console.log("Login Error:", errorText);
            alert("Login failed. Please check your credentials.");
        });
}