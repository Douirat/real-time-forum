import { isEmptyInput, formatDate } from '../../utils/comment_validators.js';
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";
import { appState } from '../../utils/state.js';
import { showErrorNotification } from "../../utils/notification.js";

export function add_comment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    
    if (isEmptyInput(commentInput?.value)) {
        showErrorNotification("Please enter a comment");
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
        commentInput.value = "";
        
        addNewCommentToTop(postId, {
            id: response.id || Date.now(),
            content: commentData.content,
            nick_name: appState.app_user.nick_name || "Anonymous",
            created_at: response.created_at || new Date().toISOString()
        });
    })
    .catch(err => {
        console.error("Error adding comment:", err);
        if (err.status) {
            render_error_page(err.status, getErrorMessage(err.status));
        } else {
            render_error_page(500, "Failed to add comment");
        }
    });
}

function addNewCommentToTop(postId, comment) {
    const container = document.getElementById(`comments-container-${postId}`);
    if (!container) return;
    
    const noCommentsMsg = container.querySelector('p');
    if (noCommentsMsg && noCommentsMsg.textContent.includes('No comments yet')) {
        noCommentsMsg.remove();
    }
    
    let commentsList = container.querySelector('.comments-list');
    
    if (!commentsList) {
        container.innerHTML = `<ul class="comments-list"></ul>`;
        commentsList = container.querySelector('.comments-list');
    }
    
    const newCommentHtml = `
        <li>
            <div class="comment">
                <div class="comment-header">
                    <strong>${comment.nick_name || 'Anonymous'}</strong>
                    <small>${formatDate(comment.created_at)}</small>
                </div>
                <p>${comment.content}</p>
            </div>
        </li>
    `;
    
    commentsList.insertAdjacentHTML('afterbegin', newCommentHtml);
    
    container.scrollTop = 0;
}