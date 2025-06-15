// Import comment functions:
import { toggle_comments, add_comment } from './comments.js';
import { navigateTo } from './script.js';

let posts_offset = 0;
const posts_limit = 10;

// Function to fetch categories:
export function fetch_categories() {
    return fetch("http://localhost:8080/get_categories")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch categories");
            }
            return response.json();
        })
        .catch(error => {
            console.error("Error fetching categories:", error);
            return [];
        });
}

// Create a function to add a new post with categories:
export function add_new_post() {
    // Get selected categories
    const selectedCategories = [];
    document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
        selectedCategories.push(parseInt(checkbox.value));
    });

    let post_data = {
        title: document.getElementById("title").value,
        content: document.getElementById("content").value,
        categories: selectedCategories
    }

    if (post_data.title == "" || post_data.content == "") {
        alert("please fill in all the post fields")
        return
    }

    fetch("http://localhost:8080/add_post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(post_data)
    })
        .then(async response => {
            if (!response.ok) {
                let err = await response.json()
                throw new Error(err)
            }
            return response.json();
        })
        .then(data => {
            // Clear input fields
            document.getElementById("title").value = "";
            document.getElementById("content").value = "";

            // Uncheck all category checkboxes
            document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
                checkbox.checked = false;
            });

            // Reset pagination and refresh posts
            offset = 0;
            navigateTo("/")
        })
        .catch(errorText => navigateTo("/login"));
}

// Enhanced show posts function with category display:
export function show_posts() {
    fetch(`http://localhost:8080/get_posts?offset=${posts_offset}&limit=${posts_limit}`)
        .then(response => response.json())
        .then(data => {
            let postsContainer = document.querySelector(".posts");

            if (posts_offset === 0) {
                postsContainer.innerHTML = "";
            }

            if (data && data.length > 0) {
                if (posts_offset === 0) {
                    data.reverse();
                }

                posts_offset += data.length;

                data.forEach(post => {
                    let postDiv = document.createElement("div");
                    postDiv.className = "post-item";

                    let userNameElement = document.createElement("h4");
                    userNameElement.textContent = `Posted by: ${post.user_name || "Unknown User"}`;

                    let timestampElement = document.createElement("small");
                    timestampElement.className = "post-timestamp";
                    timestampElement.textContent = post.created_at
                        ? `Posted on: ${new Date(post.created_at).toLocaleString()}`
                        : "";

                    let titleElement = document.createElement("h3");
                    titleElement.textContent = post.title;

                    let contentElement = document.createElement("p");
                    contentElement.textContent = post.content;

                    let categoriesElement = null;
                    if (post.categories_names) {
                        categoriesElement = document.createElement("div");
                        categoriesElement.className = "post-categories";

                        const categoriesList = post.categories_names.split(',');
                        categoriesElement.innerHTML = `
                            <small>Categories: ${categoriesList.map(cat =>
                            `<span class="category-tag">${cat.trim()}</span>`
                        ).join('')}</small>
                        `;
                    }

                    let commentButton = document.createElement("button");
                    commentButton.textContent = "Comments";
                    commentButton.className = "comment-btn";
                    commentButton.onclick = function () {
                        toggle_comments(post.id);
                    };

                    let commentsSection = document.createElement("div");
                    commentsSection.id = `comments-section-${post.id}`;

                    let commentsContainer = document.createElement("div");
                    commentsContainer.id = `comments-container-${post.id}`;
                    commentsContainer.className = "comments-container";

                    let commentForm = document.createElement("div");
                    commentForm.className = "comment-form";

                    let commentInput = document.createElement("input");
                    commentInput.id = `comment-input-${post.id}`;
                    commentInput.type = "text";
                    commentInput.placeholder = "Write a comment...";
                    commentInput.className = "comment-input";

                    let submitButton = document.createElement("button");
                    submitButton.textContent = "Submit";
                    submitButton.className = "submit-comment-btn";
                    submitButton.onclick = function () {
                        add_comment(post.id);
                    };

                    commentForm.appendChild(commentInput);
                    commentForm.appendChild(submitButton);

                    commentsSection.appendChild(commentsContainer);
                    commentsSection.appendChild(commentForm);

                    postDiv.appendChild(userNameElement);
                    postDiv.appendChild(timestampElement);
                    postDiv.appendChild(titleElement);
                    postDiv.appendChild(contentElement);
                    if (categoriesElement) {
                        postDiv.appendChild(categoriesElement);
                    }
                    postDiv.appendChild(commentButton);
                    postDiv.appendChild(commentsSection);

                    postsContainer.appendChild(postDiv);
                });

                console.log(`Loaded ${data.length} posts. New offset: ${posts_offset}`);
            } else {
                if (posts_offset === 0) {
                    postsContainer.innerHTML = "<p>No posts yet. Be the first to create one!</p>";
                }
                console.log("No more posts to load");
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}
