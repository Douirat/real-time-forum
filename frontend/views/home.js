// home.js
import { header } from "../components/header.js";
import { post_form } from "../components/forms.js";
import { fetch_categories } from "./post/fetchCategories.js";
import { show_posts, initScrollListener, reset_pagination } from "./post/showPosts.js";
import { navigateTo } from "../router/router.js";
import { render_left_aside } from "../components/left_aside.js";
import { setupUserScrollListener, load_users, logout } from "./users/users.js";
import { handle_user_profile } from "../components/profile.js";
import { sendMessage, worker } from "./chat/worker.js";


// Global variable to store categories data
let categoriesData = [];

export function render_home_page() {

  fetch("http://localhost:8080/logged_user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    })
    .then((data) => {
      worker.port.start();

// TODO: A small issue when refresh.
        sendMessage(worker, { type: "login" });
      

      fetch_categories()
        .then((categories) => {
          categoriesData = categories;

          reset_pagination();

          // Render the home page with categories
          document.body.innerHTML = /*html*/ `
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
          setupUserScrollListener()
          load_users()
          handle_user_profile();
          show_posts();
          initScrollListener();
          logout();
        })
        .catch((error) => {
          console.error("Error fetching categories:", error);
        });
    })
    .catch((error) => {
      console.log("Error:", error.message);
      navigateTo("/login");
    });
}
