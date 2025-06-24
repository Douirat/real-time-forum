import { navigateTo } from "../router/router.js";
import { render_error_page } from "../views/error.js";
import { getErrorMessage } from "../utils/error_validators.js";

export function header() {
    return /*html*/`
        <header class="header">
            <nav>
                <a href="/" class="logo">FORUM</a>
                <button class="logout">logout</button>
            </nav>
        </header>
    `;
}

export function logout() {
    let btn = document.querySelector('.logout');
    if (btn) {
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
                        const error = new Error(errorText);
                        error.status = response.status;
                        throw error;
                    }
                    return response.json();
                })
                .then(data => {
                    navigateTo("/login");
                })
                .catch(error => {
                    console.error("Logout error:", error);
                     if (error.status && error.status >= 500) {
                        render_error_page(error.status, getErrorMessage(error.status));
                    } else {
                        navigateTo("/login");
                    }
                });
        });
    }
}