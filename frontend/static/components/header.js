import { navigateTo } from "../script.js";

export function header() {
    return /*html*/`
        <header class="header">
            <nav>
                <a href="/" class="logo">FORUM</a>
                <button class="logout">logout</button>
            </nav>
        </header>
    `
}

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
                
                navigateTo("/login")
                return response.json();
            })
            .then(data => () => {
                // console.log(data)
            })
            .catch(errorText => console.log("Error:", errorText));
    })
} 