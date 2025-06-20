export function render_error_page(status = 404, message = "Page Not Found") {
  document.body.innerHTML = /*html*/`
    <section class="error-page" style="text-align:center; margin-top: 50px;">
      <h1>Error ${status}</h1>
      <p>${message}</p>
      <a href="/" style="color: blue; text-decoration: underline;">Back to Home</a>
    </section>
  `;
}
