import { fetch_posts, get_offset, reset_pagination } from '../services/post.js';
import { render_posts } from '../components/post.js';

// Enhanced show posts function with category display
export function show_posts() {
    const currentOffset = get_offset();
    
    fetch_posts(currentOffset)
        .then(data => {
            let postsContainer = document.querySelector(".posts");
            
            // Check if we got any posts
            if (data && data.length > 0) {
                // Reverse the data to show newest posts first (only for first load)
                if (currentOffset === 0) {
                    data.reverse();
                }
                
                render_posts(data, postsContainer, currentOffset === 0);
                console.log(`Loaded ${data.length} posts. New offset: ${get_offset()}`);
            } else {
                // No more posts to load
                if (currentOffset === 0) {
                    render_posts([], postsContainer, true);
                }
                console.log("No more posts to load");
            }
        })
        .catch(error => {
            console.error("Error loading posts:", error);
        });
}

// Function to load more posts (for pagination)
export function load_more_posts() {
    show_posts();
}

// Function to refresh posts
export function refresh_posts() {
    reset_pagination();
    show_posts();
}
