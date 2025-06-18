import { navigateTo, router } from "./router/router.js";
import { register_new_user, login_user } from "./views/users.js";
//import { add_new_post } from "./post.js";

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

    switch (e.target.id) {
      case "registration_form":
        register_new_user();
        break;

      case "login_form":
        login_user();
        break;

    //   case "posts_form":
    //     add_new_post();
    //     break;

      default:
        console.warn("Unknown form submitted:", e.target.id);
    }
  });
});
