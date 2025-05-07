import { registerNewUser } from "./users.js"


document.addEventListener("DOMContentLoaded", () => {
    let form_data = document.getElementById("users_form")
    // Handle the user registration form:
    form_data.addEventListener("submit", (event) => {
        event.preventDefault()
        registerNewUser()
    })
})