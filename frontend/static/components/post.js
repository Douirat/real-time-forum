export function postForm(){
    return /*html*/`
        <form >
            <h1>create Post</h1>
            <input type="text" placeholder="Title...">
            <input type="text" placeholder="Content...">
            <button type="submit">Create</button>
        </form>
    `
}