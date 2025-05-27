package handlers

import (
	"fmt"
	"net/http"
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
		http.Error(w, "Expected WebSocket upgrade", http.StatusBadRequest)
		return
	}
	
	h.webServ.HandleConnections(w, r)
}