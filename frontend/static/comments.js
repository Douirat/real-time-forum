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
        // Clear input
        commentInput.value = "";
        // Refresh comments to show the latest with proper user name
        show_comments_for_post(postId);
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
        if (!comments || comments.length === 0) {
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
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <strong style="font-size: 14px; color: #444;">${comment.user_name || 'Anonymous'}</strong>
                        <small style="color: #666;">${comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Just now'}</small>
                    </div>
                    <p style="margin: 5px 0;">${comment.content}</p>
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