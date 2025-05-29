import { header, logout } from "./components/header.js";
import {
  render_left_aside,
  display_chat_users,
} from "./components/left_aside.js";
import { post_form } from "./components/forms.js";
import { fetch_categories, show_posts } from "./post.js";
import { navigateTo } from "./script.js";


// Declare global variable to control how many posts to extract each call from database:
var offset = 0;
var limit = 10;

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

          // Render the home page with categories
          document.body.innerHTML = /*html*/ `
                        ${header()}
                        ${render_left_aside()}
                        <main>
                        
                                <div class="postForm">
                                    ${post_form(categories)}
                                </div>
                                <div class="posts">
                                    <!-- Posts will be loaded here -->
                                </div>
                         
                            </main>
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
                    `;

          // Initialize posts and scroll listener
          initialize_posts_with_scroll();
          display_chat_users();

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

// Create throttle function to prevent too frequent calls
function keep_normal_flow(fn, delay) {
  let last_call = 0;
  return (...args) => {
    const current_time = Date.now();
    if (current_time - last_call >= delay) {
      fn(...args);
      last_call = current_time;
    }
  };
}

// Initialize posts and set up scroll listener
function initialize_posts_with_scroll() {
  // Load initial posts
  show_posts();
  
  // Set up throttled scroll handler
  const throttledScrollHandler = keep_normal_flow(() => {
    console.log("Scroll event triggered");
    
    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 100
    ) {
      console.log("Near bottom, calling show_posts");
      show_posts();
    }
  }, 300);
  
  // Add scroll event listener
  window.addEventListener("scroll", throttledScrollHandler);
}