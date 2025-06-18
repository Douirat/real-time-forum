// Post component rendering
// Function to create a single post element
export function create_post_element(post) {
    // Create a new post div
    let postDiv = document.createElement("div");
    postDiv.className = "post-item";
    
    // Create UserName and timestamp element
    let userNameElement = document.createElement("h4");
    userNameElement.textContent = `Posted by: ${post.user_name || "Unknown User"}`;

    // Create timestamp element
    let timestampElement = document.createElement("small");
    timestampElement.textContent = post.created_at ? `Posted on: ${new Date(post.created_at).toLocaleString()}` : "";

    // Create title element
    let titleElement = document.createElement("h3");
    titleElement.textContent = post.title;

    // Create content element
    let contentElement = document.createElement("p");
    contentElement.textContent = post.content;
    
    // Create categories element if categories exist
    let categoriesElement = null;
    if (post.categories_names) {
        categoriesElement = document.createElement("div");
        categoriesElement.className = "post-categories";
        
        const categoriesList = post.categories_names.split(',');
        categoriesElement.innerHTML = `
            <small style="color: #666;">Categories: ${categoriesList.map(cat => 
                `<span class="category-tag" style="background-color: #f0f0f0; padding: 3px 8px; border-radius: 12px; margin-right: 5px;">${cat.trim()}</span>`
            ).join('')}</small>
        `;
    }
  
    // Assemble comment form
    commentForm.appendChild(commentInput);
    commentForm.appendChild(submitButton);

    // Assemble comments section
    commentsSection.appendChild(commentsContainer);
    commentsSection.appendChild(commentForm);

    // Add elements to post div
    postDiv.appendChild(userNameElement);
    postDiv.appendChild(timestampElement);
    postDiv.appendChild(titleElement);
    postDiv.appendChild(contentElement);
    if (categoriesElement) {
        postDiv.appendChild(categoriesElement);
    }
    postDiv.appendChild(commentButton);
    postDiv.appendChild(commentsSection);

    return postDiv;
}

// Function to render multiple posts
export function render_posts(posts, container, clearContainer = false) {
    if (clearContainer) {
        container.innerHTML = "";
    }

    if (!posts || posts.length === 0) {
        if (clearContainer) {
            container.innerHTML = "<p>No posts yet. Be the first to create one!</p>";
        }
        return;
    }

    posts.forEach(post => {
        const postElement = create_post_element(post);
        container.appendChild(postElement);
    });
}
