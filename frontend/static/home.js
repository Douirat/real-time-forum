import { header } from "./components/header.js";
import { render_chat_users } from "./components/chat_users.js";
import { post_form } from "./components/forms.js";
import { fetch_categories, show_posts } from "./post.js";
import { navigateTo } from "./script.js";
import { loadMoreUsers, logout } from "./users.js";
import { throttle } from "./utils.js";


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

            fetch_categories().then(categories => {
                categoriesData = categories;

                // Render the home page with categories
                document.body.innerHTML = /*html*/`
                    ${header()}
                    ${render_chat_users()}
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

                show_posts();
                // Show posts in a throtled manner:
                window.addEventListener("scroll", throttle(() => {
                    const scrollPosition = window.innerHeight + window.scrollY;
                    const documentHeight = document.body.offsetHeight;

                    if (scrollPosition >= documentHeight - 300) {
                        show_posts();
                    }
                }, 500)); // throttled to once every 500ms

                loadMoreUsers()
                logout();
            })
                .catch(error => {
                    console.error("Error fetching categories:", error);
                });
        })
        .catch(error => {
            console.log("Error:", error.message);
            navigateTo("/login")
        });
}


