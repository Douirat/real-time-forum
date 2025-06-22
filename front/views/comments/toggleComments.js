// toggleComments.js
import { show_comments_for_post, remove_comment_scroll_listener } from './fetchComments.js';

export function toggle_comments(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    if (!section) return;

    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        // Load comments with pagination
        show_comments_for_post(postId);
    } else {
        section.style.display = 'none';
        // Clean up scroll listener when hiding comments
        remove_comment_scroll_listener(postId);
    }
}