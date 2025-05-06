export function registerForm() {
    return /*html*/`
        <form action="#" id="users_form" method="post">
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
            </fieldset>
        </form>
    `
}