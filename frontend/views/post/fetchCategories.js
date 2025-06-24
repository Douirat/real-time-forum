import { render_error_page } from "../error.js";
import { getErrorMessage } from "../../utils/error_validators.js";
// fetchCategories.js
export function fetch_categories() {
    return fetch("http://localhost:8080/get_categories")
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                const error = new Error(errorText);
                error.status = response.status;
                throw error;
            }
            return await response.json();
        })
        .catch(error => {
            console.error("Error fetching categories:", error);

            if (error.status) {
                render_error_page(error.status, getErrorMessage(error.status));
            } else {
                render_error_page(500, "Failed to fetch categories due to an unknown error");
            }
            return [];
        });
}
