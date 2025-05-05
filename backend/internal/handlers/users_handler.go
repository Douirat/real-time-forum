package handlers

import (
	"encoding/json"
	"net/http"
	"real_time_forum/internal/models"
	"real_time_forum/internal/services"
)

// Create a structure to represent handle the user requests qnd responses:
type UsersHandlers struct {
	userService services.UsersServicesLayer
}

type Response struct {
	status, message string
}

// Instantiate a new user service:
func NewUsersService(userServ services.UsersServicesLayer) *UsersHandlers {
	return &UsersHandlers{userService: userServ}
}

// Register a new user:
func (userHandler UsersHandlers) UsersRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		user := &models.User{}
		if err := json.NewDecoder(r.Body).Decode(user); err != nil {
			http.Error(w, "Error:"+err.Error(), http.StatusBadRequest)
		} else if err := userHandler.userService.UserRegestration(user); err != nil {
			http.Error(w, "Error:"+err.Error(), http.StatusInternalServerError)
		}
		// 3. send success response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)

		response := &Response{
			status:  "success",
			message: "User registered successfully",
		}

		json.NewEncoder(w).Encode(response)
		return
	}
	http.Error(w, "Only post methods allowed", http.StatusMethodNotAllowed)
}
