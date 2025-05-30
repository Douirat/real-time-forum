export function render_right_aside() {
    return /*html*/`
        <aside id="right_aside" class="right">
            <div class="profile-card">
                <div class="profile-avatar">
                    <div class="avatar-circle">
                        <span class="avatar-text">M</span>
                    </div>
                    <div class="online-indicator"></div>
                </div>
                <h2 class="profile-name">mos3ab</h2>
                <p class="profile-status">Active now</p>
                <div class="profile-stats">
                    <div class="stat">
                        <span class="stat-number">24</span>
                        <span class="stat-label">Posts</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">156</span>
                        <span class="stat-label">Comments</span>
                    </div>
                </div>
            </div>
            
            <div class="friends-card">
                <div class="friends-header">
                    <h3>All Users</h3>
                    <span class="friends-count" id="users-count">0</span>
                </div>
                <div class="friends-list" id="all-users-list">
                    <!-- Users will be dynamically loaded here -->
                </div>
            </div>
            
            <div class="activity-card">
                <h3>Recent Activity</h3>
                <div class="activity-list">
                    <div class="activity-item">
                        <div class="activity-icon comment-icon">💬</div>
                        <div class="activity-text">
                            <span>New comment on your post</span>
                            <small>2 min ago</small>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon like-icon">❤️</div>
                        <div class="activity-text">
                            <span>Youssef liked your post</span>
                            <small>1 hour ago</small>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon post-icon">📝</div>
                        <div class="activity-text">
                            <span>You created a new post</span>
                            <small>3 hours ago</small>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    `;
}

// Function to load and display all users in the right aside
export function display_all_users() {
    const usersListContainer = document.getElementById("all-users-list");
    const usersCountElement = document.getElementById("users-count");
    
    if (!usersListContainer) {
        console.error("all-users-list element not found");
        return;
    }

    // Clear existing content
    usersListContainer.innerHTML = "";

    // Fetch all users from the backend
    fetch(`http://localhost:8080/get_users`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("All users data:", data);
            
            if (Array.isArray(data)) {
                // Update users count
                if (usersCountElement) {
                    usersCountElement.textContent = data.length;
                }

                // Create user elements
                data.forEach(user => {
                    const userItem = document.createElement("div");
                    userItem.className = "friend-item";
                    userItem.setAttribute("data-user-id", user.id);
                    
                    // Get first letter of nickname for avatar
                    const avatarLetter = user.nick_name ? user.nick_name.charAt(0).toUpperCase() : "U";
                    
                    userItem.innerHTML = `
                        <div class="friend-avatar">
                            <span>${avatarLetter}</span>
                        </div>
                        <div class="friend-info">
                            <span class="friend-name">${user.nick_name || "Unknown User"}</span>
                            <span class="friend-status">Online</span>
                        </div>
                        <div class="friend-online-dot"></div>
                    `;
                    
                    // Add click event to start chat with user
                    userItem.addEventListener("click", () => {
                        console.log("Starting chat with user:", user.nick_name);
                        // You can call your chat function here if needed
                        // create_chat_room(user);
                    });
                    
                    usersListContainer.appendChild(userItem);
                });
            } else {
                usersListContainer.innerHTML = `
                    <div class="no-users">
                        <span>No users found</span>
                    </div>
                `;
            }
        })
        .catch(err => {
            console.error("Error fetching users:", err);
            usersListContainer.innerHTML = `
                <div class="error-message">
                    <span>Failed to load users</span>
                </div>
            `;
        });
}

// Call this function after the right aside is rendered to populate users
export function init_right_aside() {
    display_all_users();
}