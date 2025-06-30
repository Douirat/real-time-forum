import { appState } from "../utils/state.js";

// fill the profile with the user that has the session:
export async function handle_user_profile() {
  const container = document.getElementById('user_profile_container'); // your container

  // Optionally show loading state before fetch
  container.innerHTML = `<p>Loading profile...</p>`;

  try {
    const response = await fetch('/get_profile', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error fetching profile: ${response.statusText}`);
    }

    const user = await response.json();
    console.log("the logged in user is: ", user);

    appState.app_user = {
      id: user.id,
      nick_name: user.nick_name,
      is_online: true,
    }

container.innerHTML = /*HTML*/`
  <section id="user_profile" class="profile-card">
    <div class="profile-details">
      <div id="profile_img">
        ${`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.trim() || '&nbsp;'}
      </div>
    </div>

    <div class="profile-details">
      <small>Full name</small>
      <p class="profile-fullname" id="profile-fullname">
        ${`${user.first_name || ''} ${user.last_name || ''}`.trim() || '&nbsp;'}
      </p>
    </div>

    <div class="profile-details">
      <small>Email</small>
      <p id="profile-email">
        ${user.email || 'N/A'}
      </p>
    </div>
  </section>
`;

  } catch (error) {
    container.innerHTML = `<p class="error">Failed to load profile: ${error.message}</p>`;
  }
}