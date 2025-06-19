export function render_error_page(status = 404, message = "Page Not Found") {
    document.body.innerHTML = /*html*/`
      <section class="error-page">
        <h1>Error ${status}</h1>
        <p>${message}</p>
        <a href="/">Back to Home</a>
      </section>
    `;
  }
  