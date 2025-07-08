// addPost.js
import { show_posts, reset_pagination } from "./showPosts.js";
import {
  isEmptyPost,
  clearPostForm,
  validatePostLength,
} from "../../utils/post_validators.js";
import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";
import { showErrorNotification } from "../../utils/notification.js";

export function add_new_post() {
  const selectedCategories = [];
  document
    .querySelectorAll(".category-checkbox:checked")
    .forEach((cb) => selectedCategories.push(parseInt(cb.value)));

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();

  if (isEmptyPost(title, content)) {
    showErrorNotification("Please fill in all the post fields");
    return;
  }
  const lengthValidation = validatePostLength(title, content);
  //console.log("eeeeeeeeeeeeeeee",lengthValidation);
  if (!lengthValidation.isValid) {
    showErrorNotification(lengthValidation.message);
    return;
  }
  const post_data = { title, content, categories: selectedCategories };

  fetch("http://localhost:8080/add_post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post_data),
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        const error = new Error(errorText);
        error.status = res.status;
        throw error;
      }
      return res.json();
    })
    .then(() => {
      clearPostForm();
      reset_pagination();
      show_posts();
    })
    .catch((err) => {
      console.error("Error adding post:", err);
      console.log(err.status);
      if (err.status) {
        render_error_page(err.status, getErrorMessage(err.status));
      } else {
        render_error_page(500, "Failed  adding post an unknown error");
      }
    });
}
