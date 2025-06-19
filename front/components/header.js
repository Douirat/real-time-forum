import { navigateTo } from "../router/router.js";

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
                        throw new Error(errorText);
                    }
                    return response.json();
                })
                .then(data => {
                    navigateTo("/login");
                })
                .catch(errorText => {
                    console.log("Error:", errorText);
                    // Navigate to login even if logout fails
                    navigateTo("/login");
                });
        });
    }
}