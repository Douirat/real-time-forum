package handlers

import (
	"encoding/json"
	"fmt"
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
func NewUsersHandlers(userServ services.UsersServicesLayer) *UsersHandlers {
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
		fmt.Println(user)

		response := &Response{
			status:  "success",
			message: "User registered successfully",
		}

		json.NewEncoder(w).Encode(response)
		return
	}
	http.Error(w, "Only post methods allowed", http.StatusMethodNotAllowed)
}

// Login handles user authentication
func (userHandler *UsersHandlers) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse login credentials
	var credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Authenticate user
	user, err := userHandler.userService.(credentials.Email, credentials.Password)
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	
	response := map[string]interface{}{
		"status":  "success",
		"message": "Login successful",
		"user": map[string]interface{}{
			"id":        user.Id,
			"nick_name": user.NickName,
			"email":     user.Email,
		},
	}
	
	json.NewEncoder(w).Encode(response)
}