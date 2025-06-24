
// Import comment functions:
import { toggle_comments, add_comment } from './comments.js';
import { navigateTo } from './script.js';
import { appState } from './state.js';

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
    const selectedCategories = [];
    document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
        selectedCategories.push(parseInt(checkbox.value));
    });

    let post_data = {
        title: document.getElementById("title").value.trim(),
        content: document.getElementById("content").value.trim(),
        categories: selectedCategories
    }

    if (post_data.title === "" || post_data.content === "") {
        alert("Please fill in all the post fields");
        return;
    }

    const submitBtn = document.querySelector("#post-form button[type='submit']");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Posting...";
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
            document.getElementById("title").value = "";
            document.getElementById("content").value = "";
            document.querySelectorAll('.category-checkbox:checked').forEach(cb => cb.checked = false);

            // ✅ Reset pagination and reload posts
            appState.posts_offset = 0;
            appState.noMorePosts = false;
            show_posts();
        })
        .catch(error => {
            console.error("Error adding post:", error);
            navigateTo("/login");
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Post";
            }
        });
}

// ✅ Enhanced show posts function with proper state management:
export function show_posts() {
    // Prevent multiple simultaneous requests
    if (appState.isFetching) {
        console.log("Already fetching posts, skipping...");
        return;
    }

    // Don't fetch if we've reached the end
    if (appState.noMorePosts) {
        console.log("No more posts available");
        return;
    }

    // Set fetching state
    appState.isFetching = true;

    fetch(`http://localhost:8080/get_posts?offset=${appState.posts_offset}&limit=${appState.posts_limit}`)
        .then(response => response.json())
        .then(data => {
            const postsContainer = document.querySelector(".posts");

            // If it's the first load, clear the container
            if (appState.posts_offset === 0) {
                postsContainer.innerHTML = "";
            }

            if (data && data.length > 0) {
                // Update offset
                appState.posts_offset += data.length;

                // Check if we got fewer posts than requested (end of data)
                if (data.length < appState.posts_limit) {
                    appState.noMorePosts = true;
                    console.log("Reached end of posts");
                }

                data.forEach(post => {
                    const postDiv = document.createElement("div");
                    postDiv.className = "post-item";

                    // Header info
                    const userNameElement = document.createElement("h4");
                    userNameElement.textContent = `Posted by: ${post.user_name || "Unknown User"}`;

                    const timestampElement = document.createElement("small");
                    timestampElement.className = "post-timestamp";
                    timestampElement.textContent = post.created_at
                        ? `Posted on: ${new Date(post.created_at).toLocaleString()}`
                        : "";

                    const titleElement = document.createElement("h3");
                    titleElement.textContent = post.title;

                    const contentElement = document.createElement("p");
                    contentElement.textContent = post.content;

                    // Categories
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

                    // Comments toggle button
                    const commentButton = document.createElement("button");
                    commentButton.textContent = "Comments";
                    commentButton.className = "comment-btn";
                    commentButton.onclick = () => toggle_comments(post.id);

                    // Comments section
                    const commentsSection = document.createElement("div");
                    commentsSection.id = `comments-section-${post.id}`;

                    const commentsContainer = document.createElement("div");
                    commentsContainer.id = `comments-container-${post.id}`;
                    commentsContainer.className = "comments-container";

                    // Add comment form
                    const commentForm = document.createElement("div");
                    commentForm.className = "comment-form";

                    const commentInput = document.createElement("input");
                    commentInput.id = `comment-input-${post.id}`;
                    commentInput.type = "text";
                    commentInput.placeholder = "Write a comment...";
                    commentInput.className = "comment-input";

                    const submitButton = document.createElement("button");
                    submitButton.textContent = "Submit";
                    submitButton.className = "submit-comment-btn";
                    submitButton.onclick = () => add_comment(post.id);

                    commentForm.appendChild(commentInput);
                    commentForm.appendChild(submitButton);

                    commentsSection.appendChild(commentsContainer);
                    commentsSection.appendChild(commentForm);

                    // Append all elements to post
                    postDiv.appendChild(userNameElement);
                    postDiv.appendChild(timestampElement);
                    postDiv.appendChild(titleElement);
                    postDiv.appendChild(contentElement);
                    if (categoriesElement) postDiv.appendChild(categoriesElement);
                    postDiv.appendChild(commentButton);
                    postDiv.appendChild(commentsSection);

                    // Append post to DOM
                    postsContainer.appendChild(postDiv);
                });

                console.log(`Loaded ${data.length} posts. New offset: ${appState.posts_offset}`);
            } else {
                // No posts found
                if (appState.posts_offset === 0) {
                    postsContainer.innerHTML = "<p>No posts yet. Be the first to create one!</p>";
                } else {
                    console.log("No more posts to load");
                    appState.noMorePosts = true;
                }
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
        })
        .finally(() => {
            // ✅ Always reset fetching state
            appState.isFetching = false;
        });
    }