export function render_left_aside() {
    return /*html*/`
<aside id="left_aside">
    
</aside>
`
}

// Create a function to fil the left asside with other users to chat with:
function display_chat() {
    let leftChild = document.getElementById("left_aside")
    let friends_container = document.createElement("div")
    friends_container.setAttribute("id", "friends_container")
    fetch("http://localhost:8080/get_users")
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            // let friend = document.createElement("button")

        })
        .catch(error => {
            console.error('Error:', error);
        });
}