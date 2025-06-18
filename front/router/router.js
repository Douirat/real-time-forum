// router.js
import { render_home_page } from "../views/home.js";
import { registration_form, login_form } from "../components/forms.js";

const routes = [
  { path: "/", view: render_home_page },
  { path: "/register", view: registration_form },
  { path: "/login", view: login_form },
];

export function navigateTo(url) {
  history.pushState(null, null, url);
  router();
}

export function router() {
  const routesWithMatch = routes.map((route) => ({
    route,
    isMatch: location.pathname === route.path,
  }));

  const match = routesWithMatch.find((r) => r.isMatch);

  if (!match) {
    console.error("Page not found");
    return;
  }

  if (match.route.view) {
    match.route.view();
  }
}
