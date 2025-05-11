import { header, logout } from "./components/header.js";
import { post_form } from "./components/forms.js";

export function render_home_page() {
    

    document.body.innerHTML = /*html*/`
        ${header()}
        <main>
            <section>
                <div class="postForm">
                    ${post_form()}
                </div>
                <div class="posts">
                    
                </div>
            </section>
            <aside class="right">
                <div class="profile">
                    <h1>mos3ab</h1>
                </div>
                <div class="friends">
                    <ul>
                        <li>youssef</li>
                        <li>smail</li>
                        <li>lfarsi</li>
                    </ul>
                </div>
            </aside>
        </main>
    `

    logout()
}
