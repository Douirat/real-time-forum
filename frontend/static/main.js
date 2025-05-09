import { registration_form, login_form } from "./components/forms.js"
import { register_new_user } from "./users.js"
import { render_home_page } from "./home.js"

function navigateTo(url) {
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
}


document.addEventListener("DOMContentLoaded", () => {
    router()
    console.log(location.pathname)
    let a = document.querySelectorAll('a')
    a.forEach(ele => {
        ele.addEventListener('click', (e) => {
            e.preventDefault()
            navigateTo(ele.href)
            if (location.pathname === "/register") {
                console.log("Called ....");

                let form_data = document.getElementById("registration_form")
                if (form_data) {
                    form_data.addEventListener("submit", (event) => {
                        event.preventDefault()
                        register_new_user()
                    })
                }
            }
        })
    })
})