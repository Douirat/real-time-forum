package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"real_time_forum/internal/handlers/utils"
	"real_time_forum/internal/services"
)

// Create a struct to represent the:
type MessagesHandler struct {
	MessageSer services.MessagesServiceLayer
	SessServ services.SessionsServicesLayer
}

// Instantiate a new Messages handler:
func NewMessagesHandler(messSer *services.MessagesService, sessSer *services.SessionService) *MessagesHandler {
	return &MessagesHandler{MessageSer: messSer, SessServ: sessSer}
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

	// Handle offset and limit
	offset := 0
	limit := 20

	if offsetParam := r.URL.Query().Get("offset"); offsetParam != "" {
		offset, err = strconv.Atoi(offsetParam)
		if err != nil || offset < 0 {
			http.Error(w, "Invalid offset parameter", http.StatusBadRequest)
			return
		}
	}

	if limitParam := r.URL.Query().Get("limit"); limitParam != "" {
		limit, err = strconv.Atoi(limitParam)
		if err != nil || limit <= 0 {
			http.Error(w, "Invalid limit parameter", http.StatusBadRequest)
			return
		}
	}

	// Session check
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized: missing session token", http.StatusUnauthorized)
		return
	}
	sessionToken := cookie.Value

	// Get messages
	messages, err := messHand.MessageSer.GetChatHistoryService(guestId, sessionToken, offset, limit)
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


// Mark a message as read:
func (messHand *MessagesHandler) MarkMessageAsRead(w http.ResponseWriter, r *http.Request) {
	fmt.Println("The server visited this handler ------->")
	fromIDStr := r.URL.Query().Get("from_id")
	fromID, err := strconv.Atoi(fromIDStr)
	if err != nil || fromID <= 0 {
		http.Error(w, "Invalid sender ID", http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "No session token found"})
		return
	}

	userID, err := messHand.SessServ.GetUserIdFromSession(cookie.Value)
	if err != nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "Invalid session"})
		return
	}

	err = messHand.MessageSer.MarkMessageAsRead(fromID, userID)
	if err != nil {
		http.Error(w, "Failed to mark as read", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
	})
}
