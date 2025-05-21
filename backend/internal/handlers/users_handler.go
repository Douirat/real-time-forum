package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"real_time_forum/internal/models"
	"real_time_forum/internal/services"
	"real_time_forum/internal/services/utils"

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
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "Invalid request body"})
		return
	}
	err = userHandler.userServ.UserRegestration(&user)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "error to regester"})
		return
	}
	utils.ResponseJSON(w, http.StatusCreated, map[string]string{"message": "User registered successfully"})
}

// Login handles user authentication
func (userHandler *UsersHandlers) UsersLoginHandler(w http.ResponseWriter, r *http.Request) {
	credentials := Credentials{}
	err := json.NewDecoder(r.Body).Decode(&credentials)
	if err != nil {
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "Invalid request body"})
		return
	}

	// Authenticate user:
	user, err := userHandler.userServ.AuthenticateUser(credentials.Email, credentials.Password)
	if err != nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "Authentication failed"})
		return
	}

	// Create a session for the authenticated user:
	token, expiresAt, err := userHandler.sessionServ.CreateSession(user.Id)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "Failed to create session"})
		return
	}

	// Set the secure session coockie:
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Expires:  expiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	// Create response with user data and session info:
	response := struct {
		UserID    int    `json:"user_id"`
		Token     string `json:"token"`
		ExpiresAt string `json:"expires_at"`
	}{
		UserID:    user.Id,
		Token:     token,
		ExpiresAt: expiresAt.Format(http.TimeFormat),
	}
	
	utils.ResponseJSON(w, http.StatusCreated, response)
}

// logout user:
func (userHandler *UsersHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	var token string
	// read session_token from cookie:
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer") {
		token = strings.TrimPrefix(authHeader, "Bearer")
	} else {
		// fallback => cookie:
		cookie, err := r.Cookie("session_token")
		if err != nil {
			utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "invalid token"})
			return
		}
		token = cookie.Value
	}

	// delete session from database :
	err := userHandler.sessionServ.DestroySession(token)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "faild to logout"})
		return
	}

	// emty cookie :
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
	})
	utils.ResponseJSON(w, http.StatusCreated, map[string]string{"message": "User logged out successfully"})
}

// logout user:
// logout user:
func (userHandler *UsersHandlers) IsLogged(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "invalid token"})
		return
	}

	token := cookie.Value
	logged := userHandler.sessionServ.IsValidSession(token)
	if !logged {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "invalid token"})
		return
	}

	utils.ResponseJSON(w, http.StatusOK, map[string]string{"message": "User logged out successfully"})
}
