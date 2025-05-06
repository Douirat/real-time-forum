import { registerForm } from "./components/forms";

export function registerPage() {
    document.body.innerHTML = /*html*/`
        ${registerForm()}    
    `
}

export function homePage() {
    document.body.innerHTML = /*html*/`
        <h2>Hello mos3ab and benaser</h2>
    `
}