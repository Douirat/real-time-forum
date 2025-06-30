// showPosts.js
import { toggle_comments } from "../comments/toggleComments.js";
import { add_comment } from "../comments/addComment.js";
import { formatDate, renderCategories } from "../../utils/post_validators.js";
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";
import { throttle, isNearBottom } from "../../utils/throttle.js";

let offset = 0;
const limit = 10;
let isLoading = false;
let hasMorePosts = true;

export function reset_pagination() {
  offset = 0;
  isLoading = false;
  hasMorePosts = true;
}

const handleScroll = throttle(() => {
  console.log("Scroll detected, checking conditions...");
  console.log("isNearBottom:", isNearBottom());
  console.log("isLoading:", isLoading);
  console.log("hasMorePosts:", hasMorePosts);

  if (isNearBottom() && !isLoading && hasMorePosts) {
    console.log("Loading more posts...");
    show_posts();
  }
}, 200);

export function initScrollListener() {
  window.addEventListener("scroll", handleScroll);
  console.log("Scroll listener initialized");
}

export function removeScrollListener() {
  window.removeEventListener("scroll", handleScroll);
}

export function show_posts() {
  if (isLoading) {
    console.log("Already loading, skipping...");
    return;
  }

  if (!hasMorePosts) {
    console.log("No more posts available");
    return;
  }

  console.log(`Loading posts with offset: ${offset}, limit: ${limit}`);
  isLoading = true;

  fetch(`http://localhost:8080/get_posts?offset=${offset}&limit=${limit}`)
    .then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        const error = new Error(errorText);
        error.status = res.status;
        throw error;
      }
      return res.json();
    })
    .then((data) => {
      //console.log('Received posts:', data.length);

      const container = document.querySelector(".posts");
      if (offset === 0) {
        container.innerHTML = "";
      }

      if (!data || !data.length) {
        if (offset === 0) {
          container.innerHTML =
            "<p>No posts yet. Be the first to create one!</p>";
        }
        hasMorePosts = false;
        console.log("No more posts to load");
        return;
      }

      if (data.length < limit) {
        hasMorePosts = false;
        console.log("Reached end of posts");
      }

      offset += data.length;

      data.forEach((post) => {
        const postDiv = document.createElement("div");
        postDiv.className = "post-item";

        postDiv.innerHTML = `
                    <h4>Posted by: ${post.user_name || "Unknown User"}</h4>
                    <small>${formatDate(post.created_at)}</small>
                    <div class="post-title">${post.title}</div>
                    <div class="post-content">${post.content}</div>
                    ${
                      post.categories_names
                        ? `<div class="post-categories">
                        <small style="color:#666">Categories: ${renderCategories(
                          post.categories_names
                        )}</small>
                    </div>`
                        : ""
                    }
                    <button class="comment-btn"><img src="/assets/imgs/speech-bubble.png" alt="comments"></button>
                    <div id="comments-section-${post.id}" style="display:none">
                        <div id="comments-container-${
                          post.id
                        }" style="margin-bottom: 15px;"></div>
                        <div class="comment-form">
                            <input id="comment-input-${
                              post.id
                            }" type="text" placeholder="Write a comment..." />
                            <button class="submit-comment-btn">Submit</button>
                        </div>
                    </div>
                `;

        postDiv.querySelector(".comment-btn").onclick = () =>
          toggle_comments(post.id);
        postDiv.querySelector(".submit-comment-btn").onclick = () =>
          add_comment(post.id);

        container.appendChild(postDiv);
      });

      console.log(`Total posts loaded so far: ${container.children.length}`);
    })
    .catch((err) => {
      console.error("Fetch error:", err);
      if (err.status) {
        render_error_page(err.status, getErrorMessage(err.status));
      } else {
        render_error_page(500, "Failed to load posts due to an unknown error");
      }
    })
    .finally(() => {
      isLoading = false;
      console.log("Loading finished");
    });
}
