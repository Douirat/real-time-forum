import { header } from "./components/header.js";
// import { render_users } from "./components/chat_users.js";
import { post_form } from "./components/forms.js";
import { fetch_categories, show_posts, add_new_post } from "./post.js";
import { navigateTo } from "./script.js";
import { load_users, logout } from "./users.js";
import { throttle } from "./utils.js";
import { sendMessage, worker } from "./worker.js";
import { render_left_aside } from "./components/left_aside.js";

// Global variable to store categories data
let categoriesData = [];



export function render_home_page() {
    fetch("http://localhost:8080/logged_user", {
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
            worker.port.start()
            sendMessage(worker, { type: "login" })

            fetch_categories().then(categories => {
                categoriesData = categories;

                // Render the home page with categories
                document.body.innerHTML = /*html*/`
                    ${header()}
                    ${render_left_aside()}
                    <main>
                        <section>
                            <div class="postForm">
                                ${post_form(categories)}
                            </div>
                            <div class="posts">
                                <!-- Posts will be loaded here -->
                            </div>
                        </section>
                    </main>
                `;

                // Add this line to attach submit listener (SPA-safe)
                const postForm = document.getElementById("post-form");
                if (postForm) {
                    postForm.addEventListener("submit", (e) => {
                        e.preventDefault();
                        add_new_post();
                    });
                }

                show_posts();

                // Show posts in a throttled manner
                window.addEventListener("scroll", throttle(() => {
                    const scrollPosition = window.innerHeight + window.scrollY;
                    const documentHeight = document.body.offsetHeight;

                    if (scrollPosition >= documentHeight - 300) {
                        show_posts();
                    }
                }, 500));

                load_users();
                logout();
            }).catch(error => {
                console.error("Error fetching categories:", error);
            });
        })
        .catch(error => {
            console.log("Error:", error.message)
            navigateTo("/login")
        });
}



