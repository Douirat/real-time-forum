package router

import (
	"net/http"
	"real_time_forum/internal/handlers"
)

// NewRouter creates and configures a new router
func NewRouter(userHandler *handlers.UsersHandlers) http.Handler {
	// Create new ServeMux
	mux := http.NewServeMux()
	
	// Register API routes
	mux.HandleFunc("/api/register", userHandler.UsersRegistrationHandler)
		
	return mux
}
