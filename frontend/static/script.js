import { registration_form, login_form } from "./components/forms.js"
import { register_new_user, login_user } from "./users.js"
import { render_home_page } from "./home.js"
import { add_new_post } from "./post.js"


export function navigateTo(url) {
    history.pushState(null, null, url)
    router()
}
async function router() {
    let routers = [
        { path: "/", view: render_home_page },
        { path: "/register", view: registration_form },
        { path: "/login", view: login_form }
    ]
    console.log(routers);

    let routes_with_booleans = routers.map(route => {
        return {
            route: route,
            isMatche: location.pathname === route.path,
        }
    })
    console.log(routes_with_booleans);
    let match = routes_with_booleans.find(selected => selected.isMatche)
    console.log("selected: ", match);

    if (!match) {
        console.error("Page not found")
        return
    }

    if (match.route.view) {
        match.route.view.apply()
    }
    render_events_handlers()
}

// run my progrqm when the DOM is loaded:
document.addEventListener("DOMContentLoaded", () => {
    router()
    console.log(location.pathname)
    let a = document.querySelectorAll('a')
    a.forEach(ele => {
        ele.addEventListener('click', (e) => {
            e.preventDefault()
            navigateTo(ele.href)
        })
    })
})


// Render events handler:
function render_events_handlers() {
    switch (location.pathname) {
        case "/register":
            setTimeout(() => {
                let registration_form = document.getElementById("registration_form")
                if (registration_form) {
                    registration_form.addEventListener("submit", (event) => {
                        event.preventDefault()
                        register_new_user()
                    })
                }
            }, 0)
            break
        case "/login":
            setTimeout(() => {
                let login_form = document.getElementById("login_form")
                if (login_form) {
                    login_form.addEventListener("submit", (event) => {
                        event.preventDefault()
                        login_user()
                    })
                }
            }, 0)
            break

        case "/":
            setTimeout(() => {
                let posts_form = document.getElementById("posts_form")
                if (posts_form) {
                    console.log("hkhkhkh")
                    posts_form.addEventListener("submit", (event) => {
                        event.preventDefault()
                        add_new_post()
                    })
                }
            }, 200)
            break
    }
}