import { navigateTo, router } from "./router/router.js";
import { register_new_user, login_user } from "./views/users.js";
import { add_new_post } from "./views/post.js";


const formHandlers = new Map([
  ["registration_form", register_new_user],
  ["login_form", login_user],
  ["posts_form", add_new_post],
]);

document.addEventListener("DOMContentLoaded", () => {
  router();

  document.body.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      e.preventDefault();
      navigateTo(e.target.href);
    }
  });

  document.body.addEventListener("submit", (e) => {
    e.preventDefault();

    const handler = formHandlers.get(e.target.id);
    if (handler) {
      handler();
    } else {
      console.warn("Unknown form submitted:", e.target.id);
    }
  });
});