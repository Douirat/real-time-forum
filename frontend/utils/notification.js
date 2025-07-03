// utils/notification.js
export function showErrorNotification(message) {
    // Remove existing error notification if any
    const existingError = document.querySelector('.error-notification');
    if (existingError) {
        existingError.remove();
    }

    // Create error notification element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-notification';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 10px;
        margin: 10px 0;
        font-size: 14px;
        text-align: center;
        animation: slideIn 0.3s ease-out;
        position: relative;
        z-index: 1000;
    `;

    // Add slide-in animation if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Try to find the most appropriate container
    let container = null;
    
    // First try to find a form container
    const form = document.getElementById('login_form') || 
                 document.querySelector('form') || 
                 document.querySelector('.post-form') ||
                 document.querySelector('.comment-form');
    
    if (form) {
        container = form;
    } else {
        // Fallback to main content area or body
        container = document.querySelector('main') || 
                   document.querySelector('.content') || 
                   document.body;
    }

    if (container) {
        // Insert at the beginning of the container
        container.insertBefore(errorElement, container.firstChild);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorElement && errorElement.parentNode) {
            errorElement.remove();
        }
    }, 5000);
}