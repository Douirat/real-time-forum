import { render_users } from "./chat_users.js";
import {render_profile} from "./profile.js"

export function render_left_aside() {
    return /*HTML*/`
 <!-- left aside -->
    <aside id="profile_users">
        ${render_profile()}
        ${render_users()}
    </aside>
`
}