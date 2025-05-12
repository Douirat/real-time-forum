
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
        .then(data => () => {
            console.log(data)
        })
        .catch(errorText => console.log("Error:", errorText));
}


// show posts :
export function show_posts() {
    // console.log(">> show_posts called")

    fetch("http://localhost:8080/get_posts")
        .then(response => {
            // console.log("Response status:", response.status);
            return response.json();
        })
        .then(data => {
            // console.log("Fetched data:", data)

            let postsContainer = document.querySelector(".posts");
            postsContainer.innerHTML = "";

            data.forEach(post => {
                // console.log("Post:", post)

                let postDiv = document.createElement("div");
                postDiv.className = "post";

                postDiv.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                `;

                postsContainer.appendChild(postDiv);
            });
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
}
