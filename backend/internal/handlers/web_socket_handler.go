package handlers

import (
	"fmt"
	"net/http"
	"real_time_forum/internal/handlers/utils"
	"real_time_forum/internal/services"
)

type WebSocketHandler struct {
	webServ services.WebSocketServiceLayer
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
