export function render_left_aside() {
  return /*HTML*/ `
    <aside id="profile_users">
      <div id="user_profile_container"></div>
      <div id="notifications"></div>
      <!-- Chat Container -->
      <div id="users_container">
        <div class="users-header">
          <h3>Users</h3>
        </div>
        <div id="users-scroll-box" style="overflow-y: auto; height: 400px;">
          <div>
            
            <h4>Online Users</h4>
            <div id="online-users-list">
              <!-- Online users will be dynamically added here -->
            </div>
          </div>
          <div>
            <h4>Offline Users</h4>
            <div id="offline-users-list">
              <!-- Offline users will be dynamically added here -->
            </div>
          </div>
        </div>
      </div>
    </aside>
  `;
}
