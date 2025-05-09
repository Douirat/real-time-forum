export function render_home_page() {
    const content = /*html*/`
        <h1>Welcome home</h1>
        <a href="/">home</a>
        <a href="/login">login</a>
        <a href="/register">register</a>
    `
    // Reinject the script to load again:
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/static/script.js';
    document.body.innerHTML = content
    document.body.appendChild(script)
    
}
