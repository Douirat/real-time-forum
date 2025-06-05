package handlers

import (
	"net/http"
	"real_time_forum/internal/handlers/utils"
	"real_time_forum/internal/services"
)

// Create the handler for the websocket:
type WebSocketHandler struct {
	socketService services.WebSocketServiceLayer
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
