package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real_time_forum/internal/models"
	"real_time_forum/internal/services"
	"strings"
	"time"
)

// UsersHandlersLayer defines the contract for user handlers
type UsersHandlersLayer interface {
	UsersRegistrationHandler(w http.ResponseWriter, r *http.Request)
	Login(w http.ResponseWriter, r *http.Request)
}

// UsersHandlers implements the user handlers contract
type UsersHandlers struct {
	userServ    services.UsersServicesLayer
	sessionServ services.SessionsServicesLayer
}

// A structure to represent the login credentials:
type Credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
}

// NewUsersHandlers creates a new user handler
func NewUsersHandlers(userServ services.UsersServicesLayer, sessionServ services.SessionsServicesLayer) *UsersHandlers {
	return &UsersHandlers{
		userServ:    userServ,
		sessionServ: sessionServ,
	}
}

// UsersRegistrationHandler handles user registration
func (userHandler *UsersHandlers) UsersRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err = userHandler.userServ.UserRegestration(&user)
	if err != nil {
		http.Error(w, fmt.Sprintf("Registration failed: %v", err), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

// Login handles user authentication
func (userHandler *UsersHandlers) Login(w http.ResponseWriter, r *http.Request) {
	credentials := Credentials{}
	fmt.Println("..........................")
	err := json.NewDecoder(r.Body).Decode(&credentials)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Authenticate user
	user, err := userHandler.userServ.AuthenticateUser(credentials.Email, credentials.Password)
	if err != nil {
		http.Error(w, fmt.Sprintf("Authentication failed: %v", err), http.StatusUnauthorized)
		return
	}

	// Create a session for the authenticated user
	token, expiresAt, err := userHandler.sessionServ.CreateSession(user.Id)
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// Hide sensitive user data
	user.Password = ""

	// Create response with user data and session info
	response := struct {
		User      *models.User `json:"user"`
		Token     string       `json:"token"`
		ExpiresAt string       `json:"expires_at"`
	}{
		User:      user,
		Token:     token,
		ExpiresAt: expiresAt.Format(http.TimeFormat),
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// logout user
func (userHandler *UsersHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	var token string
	//read session_token from cookie:
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer") {
		token = strings.TrimPrefix(authHeader, "Bearer")
	} else {
		// fallback: cookie
		cookie, err := r.Cookie("session_token")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token = cookie.Value
	}

	//delete session from database :
	err := userHandler.sessionServ.DestroySession(token)
	if err != nil {
		http.Error(w, "faild to logout", http.StatusInternalServerError)
		return
	}

	//emty cookie :
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
	})

	//response user
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Logged out successfully"))

}
