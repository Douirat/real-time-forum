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

    // Render the profile HTML inline, right after data is fetched:
    container.innerHTML = /*HTML*/`
      <section id="user_profile" class="profile-card">
        <header class="profile-header">
          <h2 id="profile-nick_name">${user.nick_name || 'Anonymous'}</h2>
          <p class="profile-fullname" id="profile-fullname">${`${user.first_name || ''} ${user.last_name || ''}`.trim() || '\u00A0'}</p>
        </header>
        <div class="profile-details">
          <p><strong>Email:</strong> <a href="mailto:${user.email || '#'}" id="profile-email">${user.email || 'N/A'}</a></p>
        </div>
      </section>
    `;

  } catch (error) {
    container.innerHTML = `<p class="error">Failed to load profile: ${error.message}</p>`;
  }
}