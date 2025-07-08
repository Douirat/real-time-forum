package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"real_time_forum/internal/handlers/utils"
	"real_time_forum/internal/models"
	"real_time_forum/internal/services"
)

// UsersHandlersLayer defines the contract for user handlers
type UsersHandlersLayer interface {
	UsersRegistrationHandler(w http.ResponseWriter, r *http.Request)
	Login(w http.ResponseWriter, r *http.Request)
}

// UsersHandlers implements the user handlers contract
type UsersHandlers struct {
	chatBroker  *services.ChatBroker
	userServ    services.UsersServicesLayer
	sessionServ services.SessionsServicesLayer
}

// A structure to represent the login credentials:
type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Create a struct to determine the limits of each:
type Edge struct {
	Offset int `json:"offset"`
	Limit  int `json:"limit"`
}

// NewUsersHandlers creates a new user handler
func NewUsersHandlers(chatBro *services.ChatBroker, userServ services.UsersServicesLayer, sessionServ services.SessionsServicesLayer) *UsersHandlers {
	return &UsersHandlers{
		chatBroker:  chatBro,
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

	// inform the chat brocker with the new registration:
	newRegistration:= &services.WebsocketMessage{
					Type:     "new_registration",
					Sender:   0,
					Content:  "a new user was registred",
					Receiver: 0,
				}

	userHandler.chatBroker.NewRegistration <- newRegistration
	
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

	userHandler.chatBroker.DeleteIfClientExist(user.Id)

	utils.ResponseJSON(w, http.StatusCreated, response)
}

func (userHandler *UsersHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	// Read session_token from cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "invalid token"})
		return
	}
	token := cookie.Value

	// Get user ID from session
	userId, err := userHandler.sessionServ.GetUserIdFromSession(token)
	if err != nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "invalid session"})
		return
	}

	// Destroy session
	err = userHandler.sessionServ.DestroySession(token)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "failed to logout"})
		return
	}

	client := &services.Client{
		UserId: userId,
	}

	userHandler.chatBroker.Unregister <- client

	// Clear the cookie
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

// IsLogged user:
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

// function to get the user profile:
func (UsersHandler *UsersHandlers) GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{"message": "invalid method"})
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "invalid token"})
		return
	}

	token := cookie.Value
	userId, err := UsersHandler.sessionServ.GetUserIdFromSession(token)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "invalid user id"})
		return
	}

	// get user by id:
	user, err := UsersHandler.userServ.GetUserProfile(userId)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "user does't exist"})
		return
	}
	user.Password = "********"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (UsersHandler *UsersHandlers) GetLastUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{"message": "invalid method"})
		return
	}

	query := r.URL.Query()
	userId := query.Get("user_id")

	if userId == "" {
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "missing user id"})
		return
	}

	userID, err := strconv.Atoi(userId)
	if err != nil || userID <= 0 {
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "invalid user id"})
		return
	}

	user, err := UsersHandler.userServ.GetUserProfile(userID)
	if err != nil {
		log.Printf("error fetching user %d: %v", userID, err)
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "error fetching the user"})
		return
	}

	user.Age = 0
	user.Email = ""
	user.Gender = ""
	user.FirstName = ""
	user.LastName = ""

	utils.ResponseJSON(w, http.StatusOK,  user)
}
