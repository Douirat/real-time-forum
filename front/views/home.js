// import { header, logout } from "./components/header.js";
// import { render_left_aside, init_chat } from "./components/left_aside.js"; // Updated import
// import { render_right_aside, init_right_aside } from "./components/right_aside.js";
import { post_form } from "../components/forms.js"
// import { fetch_categories, show_posts } from "./post.js";
// import { navigateTo } from "./script.js";
// import { create_web_socket } from "./web_socket.js";
// Global variable to store categories data
let categoriesData = [];

export function render_home_page() {
    // fetch("http://localhost:8080/is_logged", {
    //     method: "GET",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    // })
    // .then(async response => {
    //     if (!response.ok) {
    //         const errorText = await response.text();
    //         throw new Error(errorText);
    //     }
    //     return response.json();
    // })
    // .then(data => {
    //     // Initialize WebSocket connection
    //     create_web_socket(data.username || "user");
        
    //     fetch_categories().then(categories => {
    //         categoriesData = categories;

    //         // Render the home page with categories
    //         document.body.innerHTML = /*html*/`
    //                 ${header()}
    //                 ${render_left_aside()}
    //                 <main>
    //                     <section>
    //                         <div class="postForm">
    //                             ${post_form(categories)}
    //                         </div>
    //                         <div class="posts">
    //                             <!-- Posts will be loaded here -->
    //                         </div>
    //                     </section>
    //                 </main>
    //                 ${render_right_aside()}
    //             `;
            
    //         show_posts();
    //         init_chat(); // Initialize chat functionality
    //         init_right_aside(); // Initialize right aside with all users

    //         logout();
    //     })
    //     .catch(error => {
    //         console.error("Error fetching categories:", error);
    //     });
    // })
    // .catch(error => {
    //     console.log("Error:", error.message);
    //     navigateTo("/login")
    // });
     document.body.innerHTML = /*html*/`
    //               
    //                 <main>
    //                     <section>
    //                         <div class="postForm">
        <h1>hiiiiiiiiiiiiiiiiiii</h1>
    //                         </div>
    //                         <div class="posts">
    //                         </div>
    //                     </section>
    //                 </main>`
}