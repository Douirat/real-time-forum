import { header } from "./components/header.js";
import { post_form } from "./components/forms.js";
import { fetch_categories, show_posts, add_new_post } from "./post.js";
import { navigateTo } from "./script.js";
import { load_users, logout, setupUserScrollListener } from "./users.js";
import { throttle } from "./utils.js";
import { sendMessage, worker } from "./worker.js";
import { render_left_aside } from "./components/left_aside.js";
import { appState, resetAppState } from "./state.js";
import { handle_user_profile } from "./components/profile.js";



export function render_home_page() {
    resetAppState();

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
                while (document.body.firstChild) {
                    document.body.removeChild(document.body.firstChild);
                }

                document.body.innerHTML = `
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


                // Attach post form submission listener
                const postForm = document.getElementById("post-form");
                if (postForm) {
                    postForm.addEventListener("submit", (e) => {
                        e.preventDefault();
                        add_new_post();
                    });
                }

                // Init users + profile + logout
                setupUserScrollListener()
                load_users()


                handle_user_profile();
                logout();

                // Load initial posts
                show_posts();


                window.addEventListener("scroll", () => {
                    const scrollPos = window.innerHeight + window.scrollY;
                    const docHeight = document.body.offsetHeight;
                    if (scrollPos >= docHeight - 300) {
                        console.log("Near bottom, loading more posts...");
                        show_posts();
                    }
                });


            }).catch(error => {
                console.error("Error fetching categories:", error);
            });
        })
        .catch(error => {
            console.log("Error:", error.message);
            navigateTo("/login");
        });
}

