export function render_error_page(status = 404, message = "Page Not Found") {
  // Error messages for different status codes
  const errorMessages = {
      404: "The page you're looking for seems to have wandered off into the digital wilderness. Don't worry, it happens to the best of us!",
      500: "Something went wrong on our end. Our team has been notified and is working to fix this issue.",
      503: "Service is temporarily unavailable. We're working to get things back up and running.",
      403: "You don't have permission to access this resource. Please check your credentials or contact support.",
      400: "There was a problem with your request. Please check the information you provided and try again.",
      401: "You need to be authenticated to access this resource. Please log in and try again.",
      429: "Too many requests. Please slow down and try again in a moment."
  };

  // Icons for different error types
  const errorIcons = {
      404: "🚫",
      500: "⚡",
      503: "🔧",
      403: "🔒",
      400: "⚠️",
      401: "🔑",
      429: "⏰"
  };

  // Use custom message or default based on status
  const displayMessage = errorMessages[status] || message;
  const icon = errorIcons[status] || "❌";

  // Create error page HTML
  document.body.innerHTML = /*html*/`
      <section class="error-page">
          <div class="error-container">
              <div class="error-decorative-elements">
                  <div class="error-circle"></div>
                  <div class="error-circle"></div>
                  <div class="error-circle"></div>
              </div>
              
              <div class="error-icon">${icon}</div>
              <div class="error-number">${status}</div>
              <h1 class="error-title">Oops! Something went wrong</h1>
              <p class="error-message">${displayMessage}</p>
              <button class="error-back-home" onclick="window.location.href='/'">
                  <span>🏠</span>
                  Back to Home
              </button>
          </div>
      </section>
  `;
}