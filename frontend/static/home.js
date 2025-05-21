import { header, logout } from "./components/header.js";
import { render_left_aside, display_chat_users } from "./components/left_aside.js";
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
                <!-- <div id="home_container"> -->
                    ${header()}
                    ${render_left_aside()}
                    <main class="main">
                            <div class="postForm">
                                ${post_form()}
                            </div>
                            <div class="posts">
                
                            </div>
                    </main>
                    <aside class="right">
                            <div id="profile">
                                <h1>mos3ab</h1>
                            </div>
                            <div id="chat">
                            </div>
                        </aside>
                        <!-- </div> -->
                `
                show_posts()
                logout()
                display_chat_users()
            }
        })
        .catch(error => {
            console.log("Error:", error.message);
        });
}

