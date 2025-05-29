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
                    <h3>Online Friends</h3>
                    <span class="friends-count">3</span>
                </div>
                <div class="friends-list">
                    <div class="friend-item">
                        <div class="friend-avatar">
                            <span>Y</span>
                        </div>
                        <div class="friend-info">
                            <span class="friend-name">Youssef</span>
                            <span class="friend-status">Online</span>
                        </div>
                        <div class="friend-online-dot"></div>
                    </div>
                    <div class="friend-item">
                        <div class="friend-avatar">
                            <span>S</span>
                        </div>
                        <div class="friend-info">
                            <span class="friend-name">Smail</span>
                            <span class="friend-status">Away</span>
                        </div>
                        <div class="friend-away-dot"></div>
                    </div>
                    <div class="friend-item">
                        <div class="friend-avatar">
                            <span>L</span>
                        </div>
                        <div class="friend-info">
                            <span class="friend-name">Lfarsi</span>
                            <span class="friend-status">Online</span>
                        </div>
                        <div class="friend-online-dot"></div>
                    </div>
                </div>
                <button class="view-all-friends">View All Friends</button>
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