// Import comment functions
import { toggle_comments, add_comment } from './comments.js';

// Create a function to add a new post:
export function add_new_post() {
    let post_data = {
        title: document.getElementById("title").value,
        content: document.getElementById("content").value,
    }
    console.log(post_data);

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
            // Add the post ID to the post data
            post_data.id = data.id || Date.now(); // Use server ID or fallback to timestamp

            // Directly add the new post to the container without refreshing
            addPostToContainer(post_data);

            // Clear input fields
            document.getElementById("title").value = "";
            document.getElementById("content").value = "";
        })
        .catch(errorText => console.log("Error:", errorText));
}

// Function to dynamically add a new post to the container
function addPostToContainer(post) {
    let postsContainer = document.querySelector(".posts");
    console.log("post", post)

    // Create a new post div
    let postDiv = document.createElement("div");
    postDiv.className = "post-item";
    postDiv.dataset.postId = post.id;
    postDiv.style.margin = "15px 0";
    postDiv.style.padding = "15px";
    postDiv.style.border = "1px solid #ddd";
    postDiv.style.borderRadius = "5px";

    // Create UserName element
    let userNameElement = document.createElement("h3");
    userNameElement.textContent = post.user_name;
    userNameElement.style.margin = "0 0 10px 0";

    // Create title element
    let titleElement = document.createElement("h3");
    titleElement.textContent = post.title;
    titleElement.style.margin = "0 0 10px 0";

    // Create content element
    let contentElement = document.createElement("p");
    contentElement.textContent = post.content;
    contentElement.style.margin = "0 0 15px 0";

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

    commentForm.append(commentInput, submitButton, commentsContainer, commentForm)

    postDiv.append(userNameElement, titleElement, contentElement, commentButton, commentsSection)
    // Add the new post to the top of the container
    postsContainer.insertBefore(postDiv, postsContainer.firstChild);
}

// show posts:
export function show_posts() {
    fetch("http://localhost:8080/get_posts")
        .then(response => {
            return response.json();
        })
        .then(data => {
            let postsContainer = document.querySelector(".posts");
            postsContainer.innerHTML = "";

            // Reverse the data to show newest posts first
            if (data) {
                data.reverse().forEach(post => {
                    // Create a new post div
                    let postDiv = document.createElement("div");
                    postDiv.className = "post-item";
                    postDiv.dataset.postId = post.id;
                    postDiv.style.margin = "15px 0";
                    postDiv.style.padding = "15px";
                    postDiv.style.border = "1px solid #ddd";
                    postDiv.style.borderRadius = "5px";

                    // Create title element
                    let titleElement = document.createElement("h3");
                    titleElement.textContent = post.title;
                    titleElement.style.margin = "0 0 10px 0";

                    // Create content element
                    let contentElement = document.createElement("p");
                    contentElement.textContent = post.content;
                    contentElement.style.margin = "0 0 15px 0";

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
                    postDiv.appendChild(titleElement);
                    postDiv.appendChild(contentElement);
                    postDiv.appendChild(commentButton);
                    postDiv.appendChild(commentsSection);

                    // Add the post div to the container
                    postsContainer.appendChild(postDiv);
                });


            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}