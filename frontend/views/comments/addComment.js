import { isEmptyInput } from '../../utils/comment_validators.js';
import { formatDate } from '../../utils/comment_validators.js';
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";
import { appState } from '../../utils/state.js';

export function add_comment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);

    //  kyrj3 undefined bla error
    if (isEmptyInput(commentInput?.value)) {
        alert("Please enter a comment");
        return;
    }
    
    const commentData = {
        post_id: postId,
        content: commentInput.value.trim()
    };

    fetch("http://localhost:8080/commenting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData)
    })
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                const error = new Error(errorText);
                error.status = res.status;
                throw error;
            }
            return res.json();
        })
        .then((response) => {
            // Clear the input first
            commentInput.value = "";
            
            // Add the new comment to the top of the list
            addNewCommentToTop(postId, {
                id: response.id || Date.now(),
                content: commentData.content,
                nick_name: appState.app_user.nick_name || "Anonymous",
                created_at: response.created_at || new Date().toISOString()
            });
            
            console.log("Comment added successfully");
        })
        .catch(err => {
            console.error("Error adding comment:", err);
            if (err.status) {
                render_error_page(err.status, getErrorMessage(err.status));
            } else {
                render_error_page(500, "Failed to add comment due to an unknown error");
            }
        });
}

// Function to add a new comment to the top of the list
function addNewCommentToTop(postId, comment) {
    const container = document.getElementById(`comments-container-${postId}`);
    if (!container) return;
    
    // Check if there's a "No comments yet" message and remove it
    const noCommentsMsg = container.querySelector('p');
    if (noCommentsMsg && noCommentsMsg.textContent.includes('No comments yet')) {
        noCommentsMsg.remove();
    }
    
    let commentsList = container.querySelector('.comments-list');
    
    if (!commentsList) {
        // If no comments list exists, create one
        container.innerHTML = `<ul class="comments-list"></ul>`;
        commentsList = container.querySelector('.comments-list');
    }
    
    // Create the new comment HTML
    const newCommentHtml = `
        <li>
            <div class="comment">
                <div class="comment-header">
                    <strong>${appState.app_user.nick_name  || 'Anonymous'}</strong>
                    <small>${formatDate(comment.created_at)}</small>
                </div>
                <p>${comment.content}</p>
            </div>
        </li>
        
    `;
    
    // Add new comment to the very top of the list
    commentsList.insertAdjacentHTML('afterbegin', newCommentHtml);
    
    // Scroll the container to the top to show the new comment
    container.scrollTop = 0;
    
    console.log(`New comment added to top of post ${postId}`);
}