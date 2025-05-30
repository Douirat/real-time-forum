package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
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
	webServ services.WebSocketServiceLayer
	Clients *services.Hub
}

// Instantiate the websocket object to ease working:
func NewWebSocketHandler(webSer *services.WebSocketService, db *sql.DB) *WebSocketHandler {
	return &WebSocketHandler{webServ: webSer, Clients: services.NewHub(db)}
}

// Create a handler to handle the duplex comunication between clients:
func (webSoc *WebSocketHandler) WebsocketHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fmt.Println("called ...")

	// Authentificate the user:
	user, err := webSoc.webServ.AuthenticateUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	// Upgrade the http connection to websocket:
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		http.Error(w, "Failed to upgrade to WebSocket", http.StatusBadRequest)
		return
	}

	// Create a clent to ease working the chat app:
	client := &services.Client{
		NickName: user.NickName,
		UserId:   user.Id,
		Con:      conn,
		Send:     make(chan []byte, 256),
	}

	// TODO Register the user:
	webSoc.Clients.Register <- client

	// triger the go routines to writ into the connection and write to it:
	go client.WritePump()
	go client.ReadPump(webSoc.Clients)
}
