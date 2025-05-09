export function render_home_page() {
    document.body.innerHTML = /*html*/`
    <h1>Wellcome home</h1>
    <a href="/">home</a>
    <a href="/login">login</a>
    <a href="/register">register</a>
    `
    // Reinject the script to load again:
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/static/main.js';
    document.body.appendChild(script);
}