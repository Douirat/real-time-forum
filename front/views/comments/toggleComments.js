import { show_comments_for_post } from './fetchComments.js';

export function toggle_comments(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    if (!section) return;
    
    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        show_comments_for_post(postId);
    } else {
        section.style.display = 'none';
    }
}
