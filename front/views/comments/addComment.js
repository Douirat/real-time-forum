import { show_comments_for_post } from './fetchComments.js';

export function add_comment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    
    if (!commentInput || commentInput.value.trim() === "") {
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
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    })
    .then(() => {
        commentInput.value = "";
        show_comments_for_post(postId);
    })
    .catch(err => {
        console.error("Error adding comment:", err);
        alert("Failed to add comment");
    });
}
