import { formatDate } from '../../utils/comment_validators.js';
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";
import { throttle } from "../../utils/throttle.js";

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

const createScrollHandler = (postId) => {
    return throttle(() => {
        const container = document.getElementById(`comments-container-${postId}`);
        if (!container) return;

        const pagination = get_comment_pagination(postId);
        
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

        if (isNearBottom && !pagination.isLoading && pagination.hasMoreComments) {
            load_comments_for_post(postId);
        }
    }, 200);
};

const scrollHandlers = new Map();

export function init_comment_scroll_listener(postId) {
    const container = document.getElementById(`comments-container-${postId}`);
    if (!container) return;
    
    remove_comment_scroll_listener(postId);
    
    const handler = createScrollHandler(postId);
    scrollHandlers.set(postId, handler);
    container.addEventListener("scroll", handler);
}

export function remove_comment_scroll_listener(postId) {
    const handler = scrollHandlers.get(postId);
    const container = document.getElementById(`comments-container-${postId}`);
    
    if (handler && container) {
        container.removeEventListener("scroll", handler);
        scrollHandlers.delete(postId);
    }
}

export function show_comments_for_post(postId) {
    reset_comment_pagination(postId);
    load_comments_for_post(postId, () => {
        init_comment_scroll_listener(postId);
    });
}

function load_comments_for_post(postId, callback) {
    const pagination = get_comment_pagination(postId);
    
    if (pagination.isLoading || !pagination.hasMoreComments) {
        return;
    }

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
            
            if (!comments || !comments.length) {
                if (pagination.offset === 0) {
                    container.innerHTML = `<p>No comments yet</p>`;
                }
                pagination.hasMoreComments = false;
                return;
            }

            if (comments.length < COMMENTS_LIMIT) {
                pagination.hasMoreComments = false;
            }

            pagination.offset += comments.length;

            if (pagination.offset === comments.length) {
                container.innerHTML = renderCommentsList(comments);
            } else {
                const existingList = container.querySelector('.comments-list');
                if (existingList) {
                    existingList.insertAdjacentHTML('beforeend', 
                        comments.map(renderSingleComment).join('')
                    );
                }
            }
            
            if (callback) callback();
        })
        .catch(err => {
            console.error("Error loading comments:", err);
            if (err.status) {
                render_error_page(err.status, getErrorMessage(err.status));
            } else {
                render_error_page(500, "Failed to fetch comments");
            }
        })
        .finally(() => {
            pagination.isLoading = false;
        });
}

function renderCommentsList(comments) {
    return `<ul class="comments-list">
        ${comments.map(renderSingleComment).join('')}
    </ul>`;
}

function renderSingleComment(comment) {
    return `
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
}