import { formatDate } from '../../utils/comment_validators.js';
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";

export function show_comments_for_post(postId) {
    fetch(`http://localhost:8080/get_comments?id=${postId}`)
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                const error = new Error(errorText);
                error.status = res.status;
                throw error;
            }
            return res.json();
        })
        .then(comments => {
            const container = document.getElementById(`comments-container-${postId}`);
            if (!container) return;
            container.innerHTML = comments.length === 0 ? `<p>No comments yet</p>` : renderCommentsList(comments.reverse());
        })
        .catch(err => {
            console.error("Error fetching comments:", err);
            if (err.status) {
                render_error_page(err.status, getErrorMessage(err.status));
            } else {
                render_error_page(500, "Failed to Error fetching comments due to an unknown error");
            }
        });
}

function renderCommentsList(comments) {
    return `<ul class="comments-list">
        ${comments.map(c => `
            <li>
                <div class="comment">
                    <div class="comment-header">
                        <strong>${c.nick_name || 'Anonymous'}</strong>
                        <small>${formatDate(c.created_at)}</small>
                    </div>
                    <p>${c.content}</p>
                </div>
            </li>
        `).join('')}
    </ul>`;
}
