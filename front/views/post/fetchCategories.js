// fetchCategories.js
export function fetch_categories() {
    return fetch("http://localhost:8080/get_categories")
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch categories");
            return response.json();
        })
        .catch(error => {
            console.error("Error fetching categories:", error);
            return [];
        });
}
