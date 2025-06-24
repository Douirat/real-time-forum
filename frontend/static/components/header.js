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

