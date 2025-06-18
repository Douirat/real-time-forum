import { navigateTo } from '../router/router.js';

var offset = 0;
var limit = 10;

// Function to fetch categories
export function fetch_categories() {
    return fetch("http://localhost:8080/get_categories")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch categories");
            }
            return response.json();
        })
        .catch(error => {
            console.error("Error fetching categories:", error);
            return [];
        });
}

// Create a function to add a new post with categories
export function add_new_post() {
    // Get selected categories
    const selectedCategories = [];
    document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
        selectedCategories.push(parseInt(checkbox.value));
    });

    let post_data = {
        title: document.getElementById("title").value,
        content: document.getElementById("content").value,
        categories: selectedCategories
    }
   
    if (post_data.title == "" || post_data.content == "") {
        alert("please fill in all the post fields")
        return
    }
    
    fetch("http://localhost:8080/add_post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(post_data)
    })
        .then(async response => {
            if (!response.ok) {
                let err = await response.json()
                throw new Error(err)
            }
            return response.json();
        })
        .then(data => {
            // Clear input fields
            document.getElementById("title").value = "";
            document.getElementById("content").value = "";
            
            // Uncheck all category checkboxes
            document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Reset pagination and refresh posts
            reset_pagination();
            navigateTo("/")
        })
        .catch(errorText => navigateTo("/login"));
}

// Function to fetch posts with pagination
export function fetch_posts(currentOffset = offset, currentLimit = limit) {
    console.log(`Fetching posts with offset: ${currentOffset}, limit: ${currentLimit}`);
    
    return fetch(`http://localhost:8080/get_posts?offset=${currentOffset}&limit=${currentLimit}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data && data.length > 0) {
                offset += data.length;
            }
            return data;
        })
        .catch(error => {
            console.error("Fetch error:", error);
            return [];
        });
}

// Reset pagination
export function reset_pagination() {
    offset = 0;
}

// Get current offset
export function get_offset() {
    return offset;
}