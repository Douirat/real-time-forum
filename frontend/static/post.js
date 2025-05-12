// Create a function to add a new post:
export function add_new_post() {
    let post_data = {
        title: document.getElementById("title").value,
        content: document.getElementById("content").value,
    }
    console.log(post_data);

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
                const errorText = await response.text();
                throw new Error(errorText);
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            // Directly add the new post to the table without refreshing
            addPostToTable(post_data);
            
            // Clear input fields
            document.getElementById("title").value = "";
            document.getElementById("content").value = "";
        })
        .catch(errorText => console.log("Error:", errorText));
}

// Function to dynamically add a new post to the table
function addPostToTable(post) {
    let postsContainer = document.querySelector(".posts");
    let table = postsContainer.querySelector("table");
    
    // If table doesn't exist, create it
    if (!table) {
        table = document.createElement("table");
        table.style.width = "100%";

        let thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>Title</th>
                <th>Content</th>
            </tr>
        `;
        table.appendChild(thead);

        let tbody = document.createElement("tbody");
        table.appendChild(tbody);
        postsContainer.appendChild(table);
    }

    // Get the tbody
    let tbody = table.querySelector("tbody");

    // Create a new row for the post
    let row = document.createElement("tr");
    row.innerHTML = `
        <td>${post.title}</td>
        <td>${post.content}</td>
    `;

    // Add the new row to the top of the table
    tbody.insertBefore(row, tbody.firstChild);
}

// show posts :
export function show_posts() {
    fetch("http://localhost:8080/get_posts")
        .then(response => {
            return response.json();
        })
        .then(data => {
            let postsContainer = document.querySelector(".posts");
            postsContainer.innerHTML = "";

            let table = document.createElement("table");
            table.style.width = "100%";

            let thead = document.createElement("thead");
            thead.innerHTML = `
                <tr>
                    <th>Title</th>
                    <th>Content</th>
                </tr>
            `;
            table.appendChild(thead);

            let tbody = document.createElement("tbody");

            // Reverse the data to show newest posts first
            data.reverse().forEach(post => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${post.title}</td>
                    <td>${post.content}</td>
                `;
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            postsContainer.appendChild(table);
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}