package handlers

import (
	"real_time_forum/internal/services"

	"github.com/gorilla/websocket"
)

// Create the handler for the websocket:
type WebSocketHandler struct {
	socketService services.WebSocketServiceLayer
}

// Create a new instance of the websocket handler:
func NewWebSocketHandler(socketServ *services.WebSocketService){

}