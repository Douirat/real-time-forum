package handlers

import (
	"fmt"
	"net/http"
	"real_time_forum/internal/handlers/utils"
	"real_time_forum/internal/services"

	"github.com/gorilla/websocket"
)

// webSocket upgrader:
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO Allow connections from any origin (fix this later)
		return true
	},
}

type WebSocketHandler struct {
	webServ  services.WebSocketServiceLayer
}

// Constructor
func NewWebSocketHandler(ws services.WebSocketServiceLayer) *WebSocketHandler {
	return &WebSocketHandler{webServ: ws}
}

// Route handler
func (h *WebSocketHandler) WebsocketHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("WebSocket connection request received")

	// Check if it's a WebSocket upgrade request
	if r.Header.Get("Upgrade") != "websocket" {
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "Expected WebSocket upgrade"})
		return
	}
	h.webServ.HandleConnections(w, r)
}

// Get all users with their online status
func (h *WebSocketHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.webServ.GetAllUsersWithStatus()
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"error": "Failed to fetch users"})
		return
	}
	utils.ResponseJSON(w, http.StatusOK, users)
}