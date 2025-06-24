export function isEmptyInput(value) {
    return !value || value.trim() === "";
}

export function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
}