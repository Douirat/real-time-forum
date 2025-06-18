import { login_user } from "../services/auth.js";

export function render_login_page() {
    document.body.innerHTML = /*html*/`
        <div class="login-container">
            <form id="login_form" method="post">
                <fieldset class="login-fields">
                    <legend>Log-in:</legend>
                    <div>
                        <input type="email" id="email" placeholder="Email..." required>
                    </div>
                    <div>
                        <input type="password" id="password" placeholder="Password..." required>
                    </div>
                    <button type="submit">Login</button>
                </fieldset>
            </form>
        </div>
    `;
    
    // Add form submission handler
    document.getElementById("login_form").addEventListener("submit", (e) => {
        e.preventDefault();
        login_user();
    });
}