import { header, logout } from "./components/header.js";
import { post_form } from "./components/forms.js";
import { fetch_categories, show_posts, add_new_post } from "./post.js";
import { navigateTo } from "./script.js";

// Global variable to store categories data
let categoriesData = [];

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
            if (!data.is_loged) {
                navigateTo("/login")
            } else {
                // First fetch categories before rendering the page
                fetch_categories().then(categories => {
                    // Store categories globally
                    categoriesData = categories;
                    
                    // Render the home page with categories
                    document.body.innerHTML = /*html*/`
                        ${header()}
                        <main>
                            <section>
                                <div class="postForm">
                                    ${post_form(categories)}
                                </div>
                                <div class="posts">
                                    <!-- Posts will be loaded here -->
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
                    `;
                    // Load posts
                    show_posts();
                    
                    // Setup logout handler
                    logout();
                })
                .catch(error => {
                    console.error("Error fetching categories:", error);
                });
            }
        })
        .catch(error => {
            console.log("Error:", error.message);
        });
}