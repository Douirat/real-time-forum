// Import comment functions
import { toggle_comments, add_comment } from './comments.js';
import { navigateTo } from './script.js';

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
                const errorText = await response.text();
                throw new Error(errorText);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            // Clear input fields
            document.getElementById("title").value = "";
            document.getElementById("content").value = "";
            
            // Uncheck all category checkboxes
            document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Refresh posts to show the new one
            navigateTo("/")
        })
        .catch(errorText => console.log("Error:", errorText));
}

// Enhanced show posts function with category display:
export function show_posts() {
    fetch("http://localhost:8080/get_posts")
        .then(response => {
            return response.json();
        })
        .then(data => {
            let postsContainer = document.querySelector(".posts");
            postsContainer.innerHTML = "";

            // Reverse the data to show newest posts first
            if (data && data.length > 0) {
                data.reverse().forEach(post => {
                    // Create a new post div
                    let postDiv = document.createElement("div");
                    postDiv.className = "post-item";
                    postDiv.dataset.postId = post.id;
                    postDiv.style.margin = "15px 0";
                    postDiv.style.padding = "15px";
                    postDiv.style.border = "1px solid #ddd";
                    postDiv.style.borderRadius = "5px";

                    // Create UserName and timestamp element
                    let userNameElement = document.createElement("h4");
                    userNameElement.textContent = `Posted by: ${post.user_name || "Unknown User"}`;
                    userNameElement.style.margin = "0 0 5px 0";
                    userNameElement.style.color = "#666";
                    
                    // Create timestamp element
                    let timestampElement = document.createElement("small");
                    timestampElement.textContent = post.created_at ? `Posted on: ${new Date(post.created_at).toLocaleString()}` : "";
                    timestampElement.style.display = "block";
                    timestampElement.style.color = "#888";
                    timestampElement.style.fontSize = "12px";
                    timestampElement.style.marginBottom = "10px";

                    // Create title element
                    let titleElement = document.createElement("h3");
                    titleElement.textContent = post.title;
                    titleElement.style.margin = "0 0 10px 0";

                    // Create content element
                    let contentElement = document.createElement("p");
                    contentElement.textContent = post.content;
                    contentElement.style.margin = "0 0 15px 0";
                    
                    // Create categories element if categories exist
                    let categoriesElement = null;
                    if (post.categories_names) {
                        categoriesElement = document.createElement("div");
                        categoriesElement.className = "post-categories";
                        categoriesElement.style.marginBottom = "10px";
                        
                        const categoriesList = post.categories_names.split(',');
                        categoriesElement.innerHTML = `
                            <small style="color: #666;">Categories: ${categoriesList.map(cat => 
                                `<span class="category-tag" style="background-color: #f0f0f0; padding: 3px 8px; border-radius: 12px; margin-right: 5px;">${cat.trim()}</span>`
                            ).join('')}</small>
                        `;
                    }

                    // Create comment button
                    let commentButton = document.createElement("button");
                    commentButton.textContent = "Comments";
                    commentButton.className = "comment-btn";
                    commentButton.style.padding = "5px 10px";
                    commentButton.style.backgroundColor = "#f0f0f0";
                    commentButton.style.border = "1px solid #ccc";
                    commentButton.style.borderRadius = "3px";
                    commentButton.style.cursor = "pointer";
                    commentButton.style.marginTop = "10px";
                    commentButton.onclick = function () {
                        toggle_comments(post.id);
                    };

                    // Create comments section (initially hidden)
                    let commentsSection = document.createElement("div");
                    commentsSection.id = `comments-section-${post.id}`;
                    commentsSection.style.display = "none";
                    commentsSection.style.marginTop = "15px";
                    commentsSection.style.padding = "10px";
                    commentsSection.style.backgroundColor = "#f9f9f9";
                    commentsSection.style.borderRadius = "3px";

                    // Create comments container
                    let commentsContainer = document.createElement("div");
                    commentsContainer.id = `comments-container-${post.id}`;
                    commentsContainer.style.marginBottom = "15px";

                    // Create comment form
                    let commentForm = document.createElement("div");
                    commentForm.className = "comment-form";
                    commentForm.style.display = "flex";
                    commentForm.style.marginTop = "10px";

                    // Create comment input
                    let commentInput = document.createElement("input");
                    commentInput.id = `comment-input-${post.id}`;
                    commentInput.type = "text";
                    commentInput.placeholder = "Write a comment...";
                    commentInput.style.flex = "1";
                    commentInput.style.padding = "8px";
                    commentInput.style.border = "1px solid #ddd";
                    commentInput.style.borderRadius = "3px";
                    commentInput.style.marginRight = "5px";

                    // Create submit button
                    let submitButton = document.createElement("button");
                    submitButton.textContent = "Submit";
                    submitButton.style.padding = "8px 15px";
                    submitButton.style.backgroundColor = "#4CAF50";
                    submitButton.style.color = "white";
                    submitButton.style.border = "none";
                    submitButton.style.borderRadius = "3px";
                    submitButton.style.cursor = "pointer";
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
            } else {
                postsContainer.innerHTML = "<p>No posts yet. Be the first to create one!</p>";
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}