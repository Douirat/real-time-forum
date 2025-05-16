import { header, logout } from "./components/header.js";
import { post_form } from "./components/forms.js";
import { show_posts } from "./post.js";
import {navigateTo} from "./script.js"

export function render_home_page() {
    fetch("http://localhost:8080/is_logged", {
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
        .then(data => {
            console.log(data);
            if (!data.is_loged) {
                navigateTo("/login")
            } else {
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
                    show_posts()
                    logout()
      
            }
        })
        .catch(error => {
            console.log("Error:", error.message);
        });
}

