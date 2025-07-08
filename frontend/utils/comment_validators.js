export function isEmptyInput(value) {
    return !value || value.trim() === "";
}
export function validateCommentLength(content) {
  const maxLength = 100;

  if (content.length > maxLength) {
    return {
      isValid: false,
      message: `Comment content must be less than ${maxLength} characters. Current content has ${content.length} characters`,
    };
  }
  return { isValid: true };
}
export function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
}
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}