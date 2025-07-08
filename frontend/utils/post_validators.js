export function isEmptyPost(title, content) {
  return !title.trim() || !content.trim();
}
export function validatePostLength(title, content) {
  const maxLength = 255; 

  if (title.length > maxLength) {
    return {
      isValid: false,
      message: `Post title must be less than ${maxLength} characters. Current title has ${title.length} characters`,
    };
  }

  if (content.length > 10000) {
    return {
      isValid: false,
      message: `Post content must be less than ${maxLength} characters. Current content has ${content.length} characters`,
    };
  }

  return { isValid: true };
}
export function clearPostForm() {
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document
    .querySelectorAll(".category-checkbox:checked")
    .forEach((cb) => (cb.checked = false));
}

export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString();
}

export function renderCategories(categoriesStr) {
  if (!categoriesStr) return "";
  return categoriesStr
    .split(",")
    .map((c) => `<span class="category-tag">${c.trim()}</span>`)
    .join("");
}
