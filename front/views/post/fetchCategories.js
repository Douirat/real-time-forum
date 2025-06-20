// fetchCategories.js
export function fetch_categories() {
    return fetch("http://localhost:8080/get_categories")
        .then(async response => {
            if (!res.ok) {
                const errorText = await res.text();
                const error = new Error(errorText);
                error.status = res.status;
                throw error;
            }
            return res.json();
        })
        .catch(error => {
            console.error("Error fetching categories:", error);
            if (err.status) {
                render_error_page(err.status, getErrorMessage(err.status));
            } else {
                render_error_page(500, "Failed fetching categories due to an unknown error");
            }
        });
}
