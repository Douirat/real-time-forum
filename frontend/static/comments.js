// Function to add a new comment
export function add_new_comment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    
    if (!commentInput) {
        console.error(`Comment input not found for post ${postId}`);
        return;
    }

    const commentContent = commentInput.value.trim();
    
    if (commentContent === "") {
        alert("Please enter a comment");
        return;
    }

    const commentData = {
        id: 0, // Server will likely assign the ID
        post_id: postId,
        content: commentContent,
        author_id: 1, // TODO: Replace with actual user ID from session/login
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    fetch("http://localhost:8080/commenting", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(commentData)
    })
    .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        return response.json();
    })
    .then(data => {
        console.log("Comment added:", data);
        // Add comment to UI
        addCommentToPost(postId, commentData);
        // Clear input
        commentInput.value = "";
    })
    .catch(error => {
        console.error("Error adding comment:", error);
        alert("Failed to add comment");
    });
}

// Function to fetch and display comments for a specific post
export function show_comments_for_post(postId) {
    fetch(`http://localhost:8080/get_comments/${postId}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        return response.json();
    })
    .then(comments => {
        const commentsContainer = document.getElementById(`comments-container-${postId}`);
        if (!commentsContainer) {
            console.error(`Comments container not found for post ${postId}`);
            return;
        }

        // Clear existing comments
        commentsContainer.innerHTML = "";

        // If no comments, show a message
        if (comments.length === 0) {
            commentsContainer.innerHTML = `<p>No comments yet</p>`;
            return;
        }

        // Create comments list
        const commentsList = document.createElement('ul');
        commentsList.className = 'comments-list';

        // Reverse to show newest comments first
        comments.reverse().forEach(comment => {
            const commentItem = document.createElement('li');
            commentItem.innerHTML = `
                <div class="comment">
                    <p>${comment.content}</p>
                    <small>Posted on: ${comment.created_at}</small>
                </div>
            `;
            commentsList.appendChild(commentItem);
        });

        commentsContainer.appendChild(commentsList);
    })
    .catch(error => {
        console.error("Error fetching comments:", error);
    });
}

// Function to add a comment directly to the UI without refreshing
function addCommentToPost(postId, commentData) {
    const commentsContainer = document.getElementById(`comments-container-${postId}`);
    if (!commentsContainer) {
        console.error(`Comments container not found for post ${postId}`);
        return;
    }

    // Remove "No comments yet" message if it exists
    const noCommentsMessage = commentsContainer.querySelector('p');
    if (noCommentsMessage && noCommentsMessage.textContent === "No comments yet") {
        noCommentsMessage.remove();
    }

    // Get or create comments list
    let commentsList = commentsContainer.querySelector('.comments-list');
    if (!commentsList) {
        commentsList = document.createElement('ul');
        commentsList.className = 'comments-list';
        commentsContainer.appendChild(commentsList);
    }

    // Create new comment item
    const commentItem = document.createElement('li');
    commentItem.innerHTML = `
        <div class="comment">
            <p>${commentData.content}</p>
            <small>Posted just now</small>
        </div>
    `;

    // Insert at the beginning of the list
    commentsList.insertBefore(commentItem, commentsList.firstChild);
}


import { show_comments_for_post, add_new_comment } from "./comments.js";

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
            // Directly add the new post to the table without refreshing
            // Make sure we use the data from the response which includes the post ID
            addPostToTable(data);
            
            // Clear input fields
            document.getElementById("title").value = "";
            document.getElementById("content").value = "";
        })
        .catch(errorText => console.log("Error:", errorText));
}

// Function to dynamically add a new post to the table
function addPostToTable(post) {
    let postsContainer = document.querySelector(".posts");
    let table = postsContainer.querySelector("table");
    
    // If table doesn't exist, create it
    if (!table) {
        table = document.createElement("table");
        table.style.width = "100%";

        let thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Comments</th>
            </tr>
        `;
        table.appendChild(thead);

        let tbody = document.createElement("tbody");
        table.appendChild(tbody);
        postsContainer.appendChild(table);
    }

    // Get the tbody
    let tbody = table.querySelector("tbody");

    // Create a new row for the post
    let row = document.createElement("tr");
    row.innerHTML = `
        <td>${post.title}</td>
        <td>${post.content}</td>
        <td>
            <div id="comments-container-${post.id}"></div>
            <input type="text" id="comment-input-${post.id}" placeholder="Add a comment">
            <button class="comment-button" data-post-id="${post.id}">Add Comment</button>
        </td>
    `;

    // Add the new row to the top of the table
    tbody.insertBefore(row, tbody.firstChild);

    // Add event listener for the comment button
    const commentButton = row.querySelector('.comment-button');
    commentButton.addEventListener('click', () => add_new_comment(post.id));

    // Load existing comments for the post
    show_comments_for_post(post.id);
}


// show posts :
export function show_posts() {
    fetch("http://localhost:8080/get_posts")
        .then(response => {
            return response.json();
        })
        .then(data => {
            let postsContainer = document.querySelector(".posts");
            postsContainer.innerHTML = "";

            let table = document.createElement("table");
            table.style.width = "100%";

            let thead = document.createElement("thead");
            thead.innerHTML = `
                <tr>
                    <th>Title</th>
                    <th>Content</th>
                    <th>Comments</th>
                </tr>
            `;
            table.appendChild(thead);

            let tbody = document.createElement("tbody");

            // Reverse the data to show newest posts first
            data.reverse().forEach(post => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${post.title}</td>
                    <td>${post.content}</td>
                    <td>
                        <div id="comments-container-${post.id}"></div>
                        <input type="text" id="comment-input-${post.id}" placeholder="Add a comment">
                        <button class="comment-button" data-post-id="${post.id}">Add Comment</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            postsContainer.appendChild(table);

            // Add event listeners for all comment buttons
            document.querySelectorAll('.comment-button').forEach(button => {
                const postId = button.getAttribute('data-post-id');
                button.addEventListener('click', () => add_new_comment(parseInt(postId)));
            });

            // Call the function to display existing comments for each post
            data.forEach(post => {
                show_comments_for_post(post.id);
            });
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}