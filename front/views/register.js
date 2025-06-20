import { navigateTo } from "../router/router.js";
import { generate_age, isValidPassword} from "../utils/auth_validators.js";

export async function register_new_user() {
    let user = {
        id: 0,
        first_name: document.getElementById("first_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        age: generate_age(document.getElementById("birth_date").value),
        email: document.getElementById("email").value.trim(),
        gender: document.querySelector("input[name='gender']:checked").value,
        password: document.getElementById("password").value,
        confirmation: document.getElementById("confirmation").value,
        nick_name: "-",
    };

    if (!isValidPassword(user.password, user.confirmation) ||!isValidEmail(user.email)) {
        alert("invalid email or password");
        return;
    }

    fetch("http://localhost:8080/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }
            return response.json();
        })
        .then((data) => navigateTo("/login"))
        .catch((errorText) => console.log("Error:", errorText));
}