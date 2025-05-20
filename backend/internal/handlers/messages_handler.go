package handlers

import (
	"encoding/json"
	"net/http"
	"real_time_forum/internal/services"
	"strconv"
)

// Create a struct to represent the:
type MessagesHandler struct {
	MessageSer services.MessagesServiceLayer
}

// Instantiate a new Messages handler:
func NewMessagesHandler(messSer *services.MessagesService) *MessagesHandler {
	return &MessagesHandler{MessageSer: messSer}
}

// Get chat history between the client and the chosen user:
func (messHand *MessagesHandler) GetChatHistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userIDParam := r.URL.Query().Get("user_id")
	if userIDParam == "" {
		http.Error(w, "Missing user_id parameter", http.StatusBadRequest)
		return
	}

	guestId, err := strconv.Atoi(userIDParam)
	if err != nil {
		http.Error(w, "Invalid user_id format", http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized: missing session token", http.StatusUnauthorized)
		return
	}
	sessionToken := cookie.Value

	messages, err := messHand.MessageSer.GetChatHistoryService(guestId, sessionToken)
	if err != nil {
		if err.Error() == "user has no session" {
			http.Error(w, err.Error(), http.StatusUnauthorized)
		} else {
			http.Error(w, "Failed to retrieve messages", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}
