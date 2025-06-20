export function render_profile(user) {
  if (!user) {
    return /*HTML*/`
      <div id="user_profile" class="profile-loading">
        <p>Loading profile...</p>
      </div>
    `
  }

  return /*HTML*/`
    <section id="user_profile" class="profile-card">
      <header class="profile-header">
        <h2>${user.nick_name || 'Anonymous'}</h2>
        <p class="profile-fullname">${user.first_name || ''} ${user.last_name || ''}</p>
      </header>
      <div class="profile-details">
        <p><strong>Email:</strong> <a href="mailto:${user.email}">${user.email || 'N/A'}</a></p>
      </div>
    </section>
  `
}
