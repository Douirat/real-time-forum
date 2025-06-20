// showPosts.js
import { toggle_comments } from '../comments/toggleComments.js';
import { add_comment } from '../comments/addComment.js';

let offset = 0;
const limit = 10;

export function reset_pagination() {
    offset = 0;
}

export function show_posts() {
    fetch(`http://localhost:8080/get_posts?offset=${offset}&limit=${limit}`)
        .then(res => res.json())
        .then(data => {
            const container = document.querySelector(".posts");
            if (offset === 0) container.innerHTML = "";
            if (!data || !data.length) {
                if (offset === 0) container.innerHTML = "<p>No posts yet. Be the first to create one!</p>";
                return;
            }

            offset += data.length;
            if (offset === data.length) data.reverse();

            data.forEach(post => {
                const postDiv = document.createElement("div");
                postDiv.className = "post-item";
                let date = post.created_at ? new Date(post.created_at) : new Date();
                let displayDate = post.created_at ? date.toLocaleString() : "Just now";
                
                postDiv.innerHTML = `
                    <h4>Posted by: ${post.user_name || "Unknown User"}</h4>
<small>${displayDate}</small>
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                    ${post.categories_names ? `<div class="post-categories">
                        <small style="color:#666">Categories:
                            ${post.categories_names.split(',').map(c => `<span class='category-tag'>${c.trim()}</span>`).join('')}
                        </small>
                    </div>` : ''}
                    <button class="comment-btn">Comments</button>
                    <div id="comments-section-${post.id}" style="display:none">
                        <div id="comments-container-${post.id}" style="margin-bottom: 15px;"></div>
                        <div class="comment-form">
                            <input id="comment-input-${post.id}" type="text" placeholder="Write a comment..." />
                            <button class="submit-comment-btn">Submit</button>
                        </div>
                    </div>
                `;
            
                // Attach comment toggle
                postDiv.querySelector(".comment-btn").onclick = () => toggle_comments(post.id);
            
                // Attach comment submit handler
                postDiv.querySelector(".submit-comment-btn").onclick = () => add_comment(post.id);
            
                container.appendChild(postDiv);
            });
            
        })
        .catch(err => console.error("Fetch error:", err));
}
