// fetchComments.js
import { formatDate } from '../../utils/comment_validators.js';
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";
import { throttle } from "../../utils/throttle.js";

// Store pagination state for each post
const commentPagination = new Map();

const COMMENTS_LIMIT = 4;

export function reset_comment_pagination(postId) {
    commentPagination.set(postId, {
        offset: 0,
        isLoading: false,
        hasMoreComments: true
    });
}

export function get_comment_pagination(postId) {
    if (!commentPagination.has(postId)) {
        reset_comment_pagination(postId);
    }
    return commentPagination.get(postId);
}

const createCommentScrollHandler = (postId) => {
    return throttle(() => {
        const container = document.getElementById(`comments-container-${postId}`);
        if (!container) return;

        const pagination = get_comment_pagination(postId);
        
        // Check if we're near the bottom of the comments container itself
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        // Consider "near bottom" if within 50px of bottom
        const isNearContainerBottom = scrollTop + clientHeight >= scrollHeight - 50;
        
        console.log(`Comments scroll check for post ${postId}:`, {
            scrollTop,
            scrollHeight,
            clientHeight,
            isNearBottom: isNearContainerBottom,
            isLoading: pagination.isLoading,
            hasMoreComments: pagination.hasMoreComments
        });

        if (isNearContainerBottom && !pagination.isLoading && pagination.hasMoreComments) {
            console.log(`Loading more comments for post ${postId}...`);
            load_comments_for_post(postId);
        }
    }, 200);
};

// Store scroll handlers for cleanup
const scrollHandlers = new Map();

export function init_comment_scroll_listener(postId) {
    // Remove existing handler if any
    remove_comment_scroll_listener(postId);
    
    const container = document.getElementById(`comments-container-${postId}`);
    if (!container) return;
    
    const handler = createCommentScrollHandler(postId);
    scrollHandlers.set(postId, handler);
    
    // Add scroll listener to the comments container, not window
    container.addEventListener("scroll", handler);
    console.log(`Comment scroll listener initialized for post ${postId}`);
}

export function remove_comment_scroll_listener(postId) {
    const handler = scrollHandlers.get(postId);
    const container = document.getElementById(`comments-container-${postId}`);
    
    if (handler && container) {
        container.removeEventListener("scroll", handler);
        scrollHandlers.delete(postId);
        console.log(`Comment scroll listener removed for post ${postId}`);
    }
}

export function show_comments_for_post(postId) {
    // Reset pagination and start fresh
    reset_comment_pagination(postId);
    
    // Load first batch of comments
    load_comments_for_post(postId, () => {
        // Initialize scroll listener after first load
        init_comment_scroll_listener(postId);
    });
}

function load_comments_for_post(postId, callback) {
    const pagination = get_comment_pagination(postId);
    
    if (pagination.isLoading) {
        console.log(`Already loading comments for post ${postId}, skipping...`);
        return;
    }

    if (!pagination.hasMoreComments) {
        console.log(`No more comments available for post ${postId}`);
        return;
    }

    console.log(`Loading comments for post ${postId} with offset: ${pagination.offset}, limit: ${COMMENTS_LIMIT}`);
    pagination.isLoading = true;

    fetch(`http://localhost:8080/get_comments?id=${postId}&offset=${pagination.offset}&limit=${COMMENTS_LIMIT}`)
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
            
            // Handle different response types
            if (comments === null || comments === undefined || !comments.length) {
                if (pagination.offset === 0) {
                    container.innerHTML = `<p>No comments yet</p>`;
                }
                pagination.hasMoreComments = false;
                console.log(`No more comments to load for post ${postId}`);
                return;
            }

            // Check if we got fewer comments than requested (end of data)
            if (comments.length < COMMENTS_LIMIT) {
                pagination.hasMoreComments = false;
                console.log(`Reached end of comments for post ${postId}`);
            }

            // Update offset
            pagination.offset += comments.length;

            // Sort comments by created_at descending (newest first)
            const sortedComments = comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            if (pagination.offset === comments.length) {
                // First load - create new list
                container.innerHTML = renderCommentsList(sortedComments);
            } else {
                // Subsequent loads - append to bottom of existing list
                const existingList = container.querySelector('.comments-list');
                if (existingList) {
                    // Create temporary container for new comments
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = renderCommentsList(sortedComments);
                    const newListItems = tempDiv.querySelectorAll('.comments-list li');
                    
                    // Append each new comment to the existing list
                    newListItems.forEach(item => {
                        existingList.appendChild(item);
                    });
                } else {
                    // Fallback if no existing list found
                    container.innerHTML = renderCommentsList(sortedComments);
                }
            }

            console.log(`Total comments loaded for post ${postId}: ${pagination.offset}`);
            
            // Execute callback if provided
            if (callback) callback();
        })
        .catch(err => {
            console.error("ERR DETAILS:", err);
            if (err.status) {
                render_error_page(err.status, getErrorMessage(err.status));
            } else {
                render_error_page(500, "Failed to fetch comments due to an unknown error");
            }
        })
        .finally(() => {
            pagination.isLoading = false;
            console.log(`Comment loading finished for post ${postId}`);
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