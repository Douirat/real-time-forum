export function isEmptyPost(title, content) {
    return !title.trim() || !content.trim();
}

export function clearPostForm() {
    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
    document.querySelectorAll('.category-checkbox:checked').forEach(cb => cb.checked = false);
}

export function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
}

export function renderCategories(categoriesStr) {
    if (!categoriesStr) return "";
    return categoriesStr
      .split(',')
      .map(c => `<span class="category-tag">${c.trim()}</span>`)
      .join('');
  }
