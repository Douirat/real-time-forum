export function isEmptyPost(title, content) {
    return !title.trim() || !content.trim();
}

export function clearPostForm() {
    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
    document.querySelectorAll('.category-checkbox:checked').forEach(cb => cb.checked = false);
}