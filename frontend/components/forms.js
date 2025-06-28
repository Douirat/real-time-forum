// Registration form component:
export function registration_form() {
  document.body.innerHTML = /*html*/ `
                            <main>

        <form id="registration_form" method="POST">
            <fieldset id="general_field">
                <legend>Sign-up:</legend>
                <fieldset class="Personal_fields">
                    <input id="first_name" type="text" placeholder="first name..." required>
                    <input id="last_name" type="text" placeholder="last name..." required>
                    <label for="date">Born:</label>
                    <input id="birth_date" type="date" required>
                    <input id="email" type="email" placeholder="email..." required>
                </fieldset>
                <fieldset id="gender">
                    <legend>Select your gender:</legend>
                    <div>
                        <label for="Male">Male</label>
                        <input type="radio" class="gender" name="gender" value="Male" checked />
                    </div>
                    <div>
                        <label for="Female">Female</label>
                        <input type="radio" class="gender" name="gender" value="Female" />
                    </div>
                </fieldset>
                <fieldset class="Personal_fields">
                    <legend>Enter your password:</legend>
                    <div>
                        <input type="password" class="password" id="password" placeholder="password..." required />
                    </div>
                    <div>
                        <input type="password" class="password" id="confirmation" placeholder="confirmation..." required />
                    </div>
                </fieldset>
                <button type="submit">Register</button>
                <a href="/login">Login</a>
            </fieldset>
        </form>
        </main>
    `;
}

// Login form component:
export function login_form() {
  document.body.innerHTML = /*html*/ `
    <form id="login_form" method="post">
        <fieldset class="Personal_fields">
            <legend>Log-in:</legend>
            <div>
                <input type="email" class="email" id="email" placeholder="email..." required>
            </div>
            <div>
                <input type="password" class="password" id="password" placeholder="password..." required>
            </div>
            <button type="submit">Login</button>
            <a href="/register">Sign-up</a>
        </fieldset>
    </form>
    `;
}

// Enhanced post creation form with categories:
export function post_form(categories) {
  // Generate HTML for category checkboxes
  const categoriesHTML =
    categories && categories.length > 0
      ? /*HTML*/ `
            <div class="categories-container">
                <h3>Select categories:</h3>
                <div class="categories-options">
                    ${categories
                      .map(
                        (category) => `
                        <label class="category-label">
                            <input type="checkbox" class="category-checkbox" value="${category.id}"> ${category.c_name}
                        </label>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `
      : "<p>No categories available</p>";

  return /*html*/ `
        <form id="posts_form" method="POST">
            <h1>Create Post</h1>
            <input id="title" type="text" placeholder="Title..." required>
            <textarea id="content" placeholder="Content..." required></textarea>
            ${categoriesHTML}
            <button type="submit">Create</button>
        </form>
    `;
}
