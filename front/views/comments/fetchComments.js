import { formatDate } from '../../utils/comment_validators.js';

export function show_comments_for_post(postId) {
    fetch(`http://localhost:8080/get_comments?id=${postId}`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch comments");
            return res.json();
        })
        .then(comments => {
            const container = document.getElementById(`comments-container-${postId}`);
            if (!container) return;
            container.innerHTML = comments.length === 0? `<p>No comments yet</p>`: renderCommentsList(comments.reverse());
        })
        .catch(err => console.error("Error fetching comments:", err));
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
