import { startChatWithUser } from "./left_aside.js";

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

export function display_all_users() {
    const usersListContainer = document.getElementById("all-users-list");
    const usersCountElement = document.getElementById("users-count");
    
    if (!usersListContainer) {
        console.error("all-users-list element not found");
        return;
    }

    // Clear existing content
    usersListContainer.innerHTML = "";

    fetch(`http://localhost:8080/ws_users`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("WebSocket users data:", data);
            
            if (Array.isArray(data)) {
                if (usersCountElement) {
                    usersCountElement.textContent = data.length;
                }

                data.forEach(user => {
                    const userItem = document.createElement("div");
                    userItem.className = "friend-item";
                    userItem.setAttribute("data-user-id", user.id);
                    
                    const avatarLetter = user.nick_name ? user.nick_name.charAt(0).toUpperCase() : "U";
                    const onlineStatus = user.is_online ? "Online" : "Offline";
                    const onlineClass = user.is_online ? "online" : "offline";
                    
                    userItem.innerHTML = `
                        <div class="friend-avatar">
                            <span>${avatarLetter}</span>
                        </div>
                        <div class="friend-info">
                            <span class="friend-name">${user.nick_name || "Unknown User"}</span>
                            <span class="friend-status ${onlineClass}">${onlineStatus}</span>
                        </div>
                        <div class="friend-online-dot ${onlineClass}"></div>
                    `;
                    
                    userItem.addEventListener("click", () => {
                        console.log("Starting chat with user:", user);
                        startChatWithUser(user);
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

export function updateUserStatus(userId, isOnline) {
    const userItem = document.querySelector(`[data-user-id="${userId}"]`);
    if (userItem) {
        const statusElement = userItem.querySelector('.friend-status');
        const dotElement = userItem.querySelector('.friend-online-dot');
        
        if (statusElement && dotElement) {
            const onlineStatus = isOnline ? "Online" : "Offline";
            const onlineClass = isOnline ? "online" : "offline";
            const offlineClass = isOnline ? "offline" : "online";
            
            statusElement.textContent = onlineStatus;
            statusElement.classList.remove(offlineClass);
            statusElement.classList.add(onlineClass);
            
            dotElement.classList.remove(offlineClass);
            dotElement.classList.add(onlineClass);
        }
    }
}

export function init_right_aside() {
    display_all_users();
    setInterval(display_all_users, 60000);
}