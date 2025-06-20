import { header } from "./components/header.js";
import { post_form } from "./components/forms.js";
import { fetch_categories, show_posts, add_new_post } from "./post.js";
import { navigateTo } from "./script.js";
import { load_users, logout } from "./users.js";
import { throttle } from "./utils.js";
import { sendMessage, worker } from "./worker.js";
import { render_left_aside } from "./components/left_aside.js";
import { appState, resetAll } from "./state.js";
import { handle_user_profile } from "./components/profile.js";



export function render_home_page() {
    resetAll();

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
            console.log("Logged-in user:", data);

            // Setup SharedWorker communication
            worker.port.start();
            sendMessage(worker, { type: "login" });

            // Fetch and store categories
            fetch_categories().then(categories => {
                appState.categoriesData = categories;

                // Clear the body before rendering (SPA behavior)
                document.body.innerHTML = "";

                // Create container and inject full layout
                const container = document.createElement("div");
                container.classList.add("container");
                container.innerHTML = `
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

                document.body.appendChild(container);

                // Attach post form submission listener
                const postForm = document.getElementById("post-form");
                if (postForm) {
                    postForm.addEventListener("submit", (e) => {
                        e.preventDefault();
                        add_new_post();
                    });
                }

                // Init users + profile + logout
                load_users();
                handle_user_profile();
                logout();

                // Load initial posts
                show_posts();
// ✅ Only ONE scroll listener (globally) with proper throttling
window.addEventListener("scroll", throttle(() => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.body.offsetHeight;
     console.log("Near bottom — calling show_posts()", scrollPosition, " ", documentHeight);

    if (!appState.isFetching && !appState.noMorePosts && scrollPosition >= documentHeight - 300) {
        console.log("Near bottom — calling show_posts()");
        show_posts();
    }
}, 300));

            }).catch(error => {
                console.error("Error fetching categories:", error);
            });
        })
        .catch(error => {
            console.log("Error:", error.message);
            navigateTo("/login");
        });
}

