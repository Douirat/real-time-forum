// showPosts.js
import { toggle_comments } from '../comments/toggleComments.js';
import { add_comment } from '../comments/addComment.js';
import { formatDate, renderCategories } from '../../utils/post_validators.js';
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";

let offset = 0;
const limit = 10;

export function reset_pagination() {
    offset = 0;
}

export function show_posts() {
    fetch(`http://localhost:8080/get_posts?offset=${offset}&limit=${limit}`)
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                const error = new Error(errorText);
                error.status = res.status;
                throw error;
            }
            return res.json();
        })
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

                postDiv.innerHTML = `
                    <h4>Posted by: ${post.user_name || "Unknown User"}</h4>
                    <small>${formatDate(post.created_at)}</small>
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                    ${post.categories_names ? `<div class="post-categories">
                        <small style="color:#666">Categories: ${renderCategories(post.categories_names)}</small>
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

                postDiv.querySelector(".comment-btn").onclick = () => toggle_comments(post.id);
                postDiv.querySelector(".submit-comment-btn").onclick = () => add_comment(post.id);

                container.appendChild(postDiv);
            });
        })
        .catch(err => {
            console.error("Fetch error:", err);
            if (err.status) {
                render_error_page(err.status, getErrorMessage(err.status));
            } else {
                render_error_page(500, "Failed to load posts due to an unknown error");
            }
        });
}