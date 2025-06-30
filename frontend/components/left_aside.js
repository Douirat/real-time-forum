export function render_left_aside() {
  return /*HTML*/ `
    <aside id="profile_users">
      <div id="user_profile_container"></div>
      <div id="notifications"></div>
      <!-- Chat Container -->
      <div id="users_container">
        <div class="users-header">
        </div>
        <div id="users-scroll-box" style="overflow-y: auto; height: 400px;">
        
            <strong>Chat users</strong>
            <div id="chat_users">
              <!-- Online users will be dynamically added here -->
            </div>
     
          </div>
        </div>
      </div>
    </aside>
  `;
}
