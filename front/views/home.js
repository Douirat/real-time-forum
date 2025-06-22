// home.js
import { header, logout } from "../components/header.js";
import { post_form } from "../components/forms.js";
import { fetch_categories } from "./post/fetchCategories.js";
import {
  show_posts,
  initScrollListener,
  reset_pagination,
} from "./post/showPosts.js";
import { navigateTo } from "../router/router.js";

// Global variable to store categories data
let categoriesData = [];

export function render_home_page() {
  fetch("http://localhost:8080/is_logged", {
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
      fetch_categories()
        .then((categories) => {
          categoriesData = categories;

          reset_pagination();

          // Render the home page with categories
          document.body.innerHTML = /*html*/ `
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
                </main>
            `;
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
