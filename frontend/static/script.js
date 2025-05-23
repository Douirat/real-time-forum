import { registration_form, login_form } from "./components/forms.js";
import { register_new_user, login_user } from "./users.js";
import { render_home_page } from "./home.js";
import { add_new_post } from "./post.js";

export function navigateTo(url) {
  history.pushState(null, null, url);
  router();
}

async function router() {
  let routers = [
    { path: "/", view: render_home_page },
    { path: "/register", view: registration_form },
    { path: "/login", view: login_form },
  ];

  let routes_with_booleans = routers.map((route) => {
    return {
      route: route,
      isMatche: location.pathname === route.path,
    };
  });
  let match = routes_with_booleans.find((selected) => selected.isMatche);

  if (!match) {
    console.error("Page not found");
    return;
  }

  if (match.route.view) {
    match.route.view.apply();
  }
}

// Use event delegation - add ONE listener to document.body that handles all form submissions
document.addEventListener("DOMContentLoaded", () => {
  router();

  // Handle navigation clicks
  document.body.addEventListener("click", (e) => {
    if (e.target.closest('a')) {
      e.preventDefault();
      navigateTo(e.target.href);
    }
  });

  // Handle all form submissions using event delegation
  document.body.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Check which form was submitted based on its ID
    if (e.target.id === "registration_form") {
      register_new_user();
    } else if (e.target.id === "login_form") {
      login_user();
    } else if (e.target.id === "posts_form") {
      add_new_post();
    }
  });
});