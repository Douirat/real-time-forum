// Import comment functions
import { toggle_comments, add_comment } from './comments.js';
import { navigateTo } from '../router/router.js';

var offset = 0;
var limit = 10;

// Function to fetch categories
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
        categories: selectedCategories // Add categories to the post data
    }

    if (post_data.title.trim() === "" || post_data.content.trim() === "") {
        alert("please fill in all the post fields");
        return;
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
                let err = await response.json();
                throw new Error(err);
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
            reset_pagination();
            show_posts();
        })
        .catch(errorText => {
            console.error("Error adding post:", errorText);
            navigateTo("/login");
        });
}

// Enhanced show posts function with category display:
export function show_posts() {
    console.log(`Fetching posts with offset: ${offset}, limit: ${limit}`);

    fetch(`http://localhost:8080/get_posts?offset=${offset}&limit=${limit}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            let postsContainer = document.querySelector(".posts");

            // If this is the first load (offset = 0), clear the container
            if (offset === 0) {
                postsContainer.innerHTML = "";
            }

            // Check if we got any posts
            if (data && data.length > 0) {
                // Update offset for next batch
                offset += data.length;

                // Reverse the data to show newest posts first (only for first load)
                if (offset === data.length) {
                    data.reverse();
                }

                data.forEach(post => {
                    // Create a new post div
                    let postDiv = document.createElement("div");
                    postDiv.className = "post-item";

                    // Create UserName and timestamp element
                    let userNameElement = document.createElement("h4");
                    userNameElement.textContent = `Posted by: ${post.user_name || "Unknown User"}`;

                    // Create timestamp element
                    let timestampElement = document.createElement("small");
                    timestampElement.textContent = post.created_at ? `Posted on: ${new Date(post.created_at).toLocaleString()}` : "";

                    // Create title element
                    let titleElement = document.createElement("h3");
                    titleElement.textContent = post.title;

                    // Create content element
                    let contentElement = document.createElement("p");
                    contentElement.textContent = post.content;

                    // Create categories element if categories exist
                    let categoriesElement = null;
                    if (post.categories_names) {
                        categoriesElement = document.createElement("div");
                        categoriesElement.className = "post-categories";

                        const categoriesList = post.categories_names.split(',');
                        categoriesElement.innerHTML = `
                            <small style="color: #666;">Categories: ${categoriesList.map(cat =>
                            `<span class="category-tag">${cat.trim()}</span>`
                        ).join('')}</small>
                        `;
                    }

                    // Create comment button
                    let commentButton = document.createElement("button");
                    commentButton.textContent = "Comments";
                    commentButton.className = "comment-btn";
                    commentButton.onclick = function () {
                        toggle_comments(post.id);
                    };

                    // Create comments section (initially hidden)
                    let commentsSection = document.createElement("div");
                    commentsSection.id = `comments-section-${post.id}`;
                    commentsSection.style.display = "none";

                    // Create comments container
                    let commentsContainer = document.createElement("div");
                    commentsContainer.id = `comments-container-${post.id}`;
                    commentsContainer.style.marginBottom = "15px";

                    // Create comment form
                    let commentForm = document.createElement("div");
                    commentForm.className = "comment-form";

                    // Create comment input
                    let commentInput = document.createElement("input");
                    commentInput.id = `comment-input-${post.id}`;
                    commentInput.type = "text";
                    commentInput.placeholder = "Write a comment...";

                    // Create submit button
                    let submitButton = document.createElement("button");
                    submitButton.textContent = "Submit";
                    submitButton.onclick = function () {
                        add_comment(post.id);
                    };

                    // Assemble comment form
                    commentForm.appendChild(commentInput);
                    commentForm.appendChild(submitButton);

                    // Assemble comments section
                    commentsSection.appendChild(commentsContainer);
                    commentsSection.appendChild(commentForm);

                    // Add elements to post div
                    postDiv.appendChild(userNameElement);
                    postDiv.appendChild(timestampElement);
                    postDiv.appendChild(titleElement);
                    postDiv.appendChild(contentElement);
                    if (categoriesElement) {
                        postDiv.appendChild(categoriesElement);
                    }
                    postDiv.appendChild(commentButton);
                    postDiv.appendChild(commentsSection);

                    // Add the post div to the container
                    postsContainer.appendChild(postDiv);
                });

                console.log(`Loaded ${data.length} posts. New offset: ${offset}`);
            } else {
                // No more posts to load
                if (offset === 0) {
                    postsContainer.innerHTML = "<p>No posts yet. Be the first to create one!</p>";
                }
                console.log("No more posts to load");
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}

// Reset pagination (useful when adding new posts or refreshing)
export function reset_pagination() {
    offset = 0;
}