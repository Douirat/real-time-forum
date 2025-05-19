export function render_left_aside(web_socket) {
    return /*html*/`
<aside id="left_aside" class="left">
    </aside>
    `
}


// Create a function to fil the left asside with other users to chat with:
export function display_chat_users() {
    let left_side = document.getElementById("left_aside")
    let friends_container = document.createElement("div")
    friends_container.setAttribute("id", "friends_container")
    const offset = 0;
    const limit = 10;

    fetch(`http://localhost:8080/get_users?offset=${offset}&limit=${limit}`)
        .then(res => res.json())
        .then(data => {
            console.log(data)
            data.forEach(user => {
                let chat = document.createElement("div")
                chat.setAttribute("id", user.id)
                chat.setAttribute("class", "user_chat")
                let live_flag =  document.createElement("div")
                live_flag.setAttribute("id", "live_flag")
                let live_user = document.createElement("small")
                   live_user.textContent = user.nick_name
                chat.append(live_flag, live_user)
                chat.addEventListener("click", ()=>{
                    console.log("I want to chat with this user: ", user.nick_name);
                    create_chat_room(user.id)
                    
                })
                friends_container.appendChild(chat)
            })
            left_side.appendChild(friends_container)
        })
        .catch(err => console.error(err));
}

// Create a chat room between tow users:
function create_chat_room(id){
// Bring all the messages between tow clints:
fetch(`http://localhost:8080/get_chat?user_id=${id}`)
  .then(function(response) {
    return response.json(); // Convert the response to JSON
  })
  .then(function(data) {
    console.log(data); // Handle the data received from the API
  })
  .catch(function(error) {
    console.error('Error fetching:', error); // Handle errors
  });
}