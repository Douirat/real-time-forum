package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real_time_forum/internal/handlers/utils"
	"real_time_forum/internal/services"
)

// Create the handler for the websocket:
type WebSocketHandler struct {
	socketService services.WebSocketServiceLayer
	chatBroker *services.Hub
}

// Create a new instance of the websocket handler:
func NewWebSocketHandler(socketServ *services.WebSocketService) *WebSocketHandler {
	return &WebSocketHandler{socketService: socketServ}
}

func (soc *WebSocketHandler) SocketHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{"message": "invalid method"})
		return
	}
	if r.Header.Get("Upgrade") != "websocket" {
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "Expected WebSocket upgrade"})
		return
	}
	if err := soc.socketService.CreateNewWebSocket(w, r); err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "failed to create websocket"})
		return

	}
}

// Get all users with their online status
func (soc *WebSocketHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
    users, err := soc.socketService.GetAllUsersWithStatus()
    if err != nil {
        utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"error": "Failed to fetch users"})
        return
    }
    
    // Debug print that shows actual data, not memory addresses:
    for i, user := range users {
        fmt.Printf("User %d: ID=%d, Name=%s, Online=%t\n", i, user.Id, user.NickName, user.IsOnline)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(users)
}