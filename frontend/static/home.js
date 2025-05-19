import { header, logout } from "./components/header.js";
import { post_form } from "./components/forms.js";
import { render_chat_area } from "./components/chat.js";
import { show_posts } from "./post.js";
import { navigateTo } from "./script.js"

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
                    </main>
                    <aside class="right">
                            <div id="profile">
                                <h1>mos3ab</h1>
                            </div>
                            <div id="chat">
                            </div>
                        </aside>
                `
                show_posts()
                logout()
                render_chat_area()
            }
        })
        .catch(error => {
            console.log("Error:", error.message);
        });
}

