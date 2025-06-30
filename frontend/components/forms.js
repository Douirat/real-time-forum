// Registration form component:
export function registration_form() {
    document.body.innerHTML = /*html*/`
            <header class="header">
            <nav>
                <a href="/" class="logo">FORUM</a>
            </nav>
        </header>
<div class="form_container">
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

                    <div class="gender_organizer">
                        <label for="Male">Male:</label>
                        <input type="radio" class="gender" name="gender" value="Male" checked />
                    </div>
                  <div class="gender_organizer">
                                      <label for="Female">Female:</label>
                                      <input type="radio" class="gender" name="gender" value="Female" />
                    </div>
            
                </fieldset>
                <fieldset class="Personal_fields">
                    <legend>Enter your password:</legend>
                
                        <input type="password" class="password" id="password" placeholder="password..." required />
             
             
                        <input type="password" class="password" id="confirmation" placeholder="confirmation..." required />
            
                </fieldset>
                <button class="login_register_btn" type="submit">Register</button>
                <a href="/login">Login</a>
            </fieldset>
        </form>
    </div>
       
    `;
}

// Login form component:
export function login_form() {
    document.body.innerHTML = /*html*/`
            <header class="header">
            <nav>
                <a href="/" class="logo">FORUM</a>
            </nav>
        </header>
     <div class="form_container">
            <form id="login_form" method="post">
        <fieldset class="Personal_fields">
            <legend>Log-in:</legend>
                <input type="email" class="email" id="email" placeholder="email..." required>
                <input type="password" class="password" id="password" placeholder="password..." required>
            <button class="login_register_btn" type="submit">Login</button>
            <a href="/register">Sign-up</a>
        </fieldset>
    </form>
    </div>
    `;
}

// Enhanced post creation form with categories:
export function post_form(categories) {
    // Generate HTML for category checkboxes
    const categoriesHTML = categories && categories.length > 0
        ? /*HTML*/ `
            <div class="categories-container">
                <h4>Select categories</h4>
                <div class="categories-options">
                    ${categories.map(category => `
                        <div class="post_check">
                        <small>${category.c_name}</small>
                        <input type="checkbox" class="category-checkbox" value="${category.id}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `
        : '<p>No categories available</p>';

    return /*html*/`
        <form id="posts_form" method="POST">
            <h1>Create Post</h1>
            <input id="title" type="text" placeholder="Title..." required>
            <textarea id="content" placeholder="Content..." required></textarea>
            ${categoriesHTML}
            <button class="login_register_btn" type="submit">Create</button>
        </form>
    `;
}