// addPost.js
import { navigateTo } from '../../router/router.js';
import { show_posts, reset_pagination } from './showPosts.js';
import { isEmptyPost ,clearPostForm} from '../../utils/post_validators.js';

export function add_new_post() {
    const selectedCategories = [];
    document.querySelectorAll('.category-checkbox:checked')
        .forEach(cb => selectedCategories.push(parseInt(cb.value)));

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();

    if (isEmptyPost(title, content)) {
        alert("Please fill in all the post fields");
        return;
    }
    const post_data = { title, content, categories: selectedCategories };

    fetch("http://localhost:8080/add_post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post_data)
    })
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then(() => {
            clearPostForm();
            reset_pagination();
            show_posts();
        })
        .catch(err => {
            console.error("Error adding post:", err);
            navigateTo("/login");
        });
}