// Function to add a new comment
export function add_comment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    
    if (!commentInput || commentInput.value.trim() === "") {
        alert("Please enter a comment");
        return;
    }
    
    const commentData = {
        post_id: postId,
        content: commentInput.value
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
    fetch(`http://localhost:8080/get_comments?id=${postId}`)
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
        commentsList.style.listStyleType = 'none';
        commentsList.style.padding = '0';
        
        // Reverse to show newest comments first
        comments.reverse().forEach(comment => {
            const commentItem = document.createElement('li');
            commentItem.innerHTML = `
                <div class="comment" style="margin-bottom: 10px; border-left: 3px solid #ccc; padding-left: 10px;">
                    <p style="margin: 5px 0;">${comment.content}</p>
                    <small style="color: #666;">Posted on: ${comment.created_at || 'Just now'}</small>
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
        commentsList.style.listStyleType = 'none';
        commentsList.style.padding = '0';
        commentsContainer.appendChild(commentsList);
    }
    
    // Create new comment item
    const commentItem = document.createElement('li');
    commentItem.innerHTML = `
        <div class="comment" style="margin-bottom: 10px; border-left: 3px solid #ccc; padding-left: 10px;">
            <p style="margin: 5px 0;">${commentData.content}</p>
            <small style="color: #666;">Posted just now</small>
        </div>
    `;
    
    // Insert at the beginning of the list
    commentsList.insertBefore(commentItem, commentsList.firstChild);
}

// Function to toggle the comments section for a post
export function toggle_comments(postId) {
    const commentsSection = document.getElementById(`comments-section-${postId}`);
    
    if (commentsSection.style.display === 'none' || commentsSection.style.display === '') {
        commentsSection.style.display = 'block';
        show_comments_for_post(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}