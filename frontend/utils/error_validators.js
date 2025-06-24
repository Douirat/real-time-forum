export function getErrorMessage(status) {
    switch(status) {
      case 400: return "Bad Request";
      case 401: return "Unauthorized. Please login.";
      case 403: return "Forbidden Access";
      case 404: return "Page Not Found";
      case 500: return "Internal Server Error. Please try later.";
      default: return "An unexpected error occurred.";
    }
  }