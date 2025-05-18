// Registration form component:
export function registration_form() {
    document.body.innerHTML = /*html*/`
        <form id="registration_form" method="POST">
            <fieldset id="general_field">
                <legend>Sign-up:</legend>
                <fieldset class="Personal_fields">
                    <input id="first_name" type="text" placeholder="first name..." required>
                    <input id="last_name" type="text" placeholder="last name..." required>
                    <label for="date">Born:</label>
                    <input id="birth_date" type="date">
                    <input id="email" type="text" placeholder="email..." required>
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
                <input id="submit" type="submit">
                <a href="/login">Login</a>
            </fieldset>
        </form>
    `

    // Reinject the script to load again:
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/static/script.js';
    document.body.appendChild(script);
}

// Login form component:
export function login_form() {
    document.body.innerHTML = /*html*/`
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

    // Reinject the script to load again:
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/static/script.js';
    document.body.appendChild(script);
}

// The post creation form:
export function post_form() {
    return /*html*/`
        <form id="posts_form" method="POST">
            <h1>Create Post</h1>
            <input id="title" type="text" placeholder="Title..." required>
            <input id="content" type="text" placeholder="Content..." required>
            
            <h3>Select Categories</h3>
            <label>
                <input type="checkbox" id="sport" value="1"> Sport
            </label>
            <label>
                <input type="checkbox" id="coding" value="2"> Coding
            </label>
            <label>
                <input type="checkbox" id="culture" value="3"> Culture
            </label>
            <label>
                <input type="checkbox" id="technology" value="4"> Technology
            </label>

            <button type="submit">Create</button>
        </form>
    `;
}
