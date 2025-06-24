import { render_home_page } from "../views/home.js";
import { registration_form, login_form } from "../components/forms.js";
import { render_error_page } from "../views/error.js";
import { getErrorMessage } from "../utils/error_validators.js";

const routes = {
    "/": render_home_page,
    "/login": login_form,
    "/register": registration_form
};

export function navigateTo(url) {
    history.pushState(null, null, url);
    router();
}

export function router() {
    const path = window.location.pathname;
    const route = routes[path];
    if (route) {
        route();
    } else {
        const status = 404;
        const message = getErrorMessage(status);
        render_error_page(status, message);    }
}

// Handle browser back/forward buttons
window.addEventListener("popstate", router);