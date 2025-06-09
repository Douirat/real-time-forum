package services

import (
	"errors"
	"log"
	"net/http"
	"sync"

	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"

	"github.com/gorilla/websocket"
)

// Service interface
type WebSocketServiceLayer interface {
	CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error
	GetAllUsersWithStatus() ([]*models.ChatUser, error)
}

// Main service struct
type WebSocketService struct {
	hub         *Hub
	messageRepo repositories.MessageRepositoryLayer
	sessRepo    repositories.SessionsRepositoryLayer
	userRepo    repositories.UsersRepositoryLayer
}

// Message structure
type WebSocketMessage struct {
	Type      string `json:"type"`
	Sender    int    `json:"sender"`
	Recipient int    `json:"recipient"`
	Content   string `json:"content"`
	UserID    int    `json:"user_id,omitempty"`
}

// Client represents a connected user
type Client struct {
	UserID int
	Conn   *websocket.Conn
	Send   chan *WebSocketMessage
}

// Hub manages all connections and online status
type Hub struct {
	// Map of userID -> list of clients
	users map[int][]*Client
	mu    sync.RWMutex

	// Channels for managing connections
	register   chan *Client
	unregister chan *Client
	broadcast  chan *WebSocketMessage
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://localhost:8080"
	},
}

// Create new service
func NewWebSocketService(hub *Hub, messRepo repositories.MessageRepositoryLayer, sessRepo repositories.SessionsRepositoryLayer, userRepo repositories.UsersRepositoryLayer) *WebSocketService {
	return &WebSocketService{
		hub:         hub,
		messageRepo: messRepo,
		sessRepo:    sessRepo,
		userRepo:    userRepo,
	}
}

// Create new hub
func NewChatBroker() *Hub {
	return &Hub{
		users:      make(map[int][]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *WebSocketMessage),
	}
}

// ========== ONLINE/OFFLINE MANAGEMENT (SIMPLIFIED) ==========

// Check if user is online (has any connections)
func (h *Hub) IsUserOnline(userID int) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	clients, exists := h.users[userID]
	return exists && len(clients) > 0
}

// Add client connection for user
func (h *Hub) addClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.users[client.UserID] = append(h.users[client.UserID], client)
}

// Remove client connection for user
func (h *Hub) removeClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// kanjib lclients dyal dak user
	clients := h.users[client.UserID]

	// kanjib clients jdod ghira li ma chi howa dak client
	newClients := []*Client{}
	for _, c := range clients {
		if c != client {
			newClients = append(newClients, c)
		}
	}

	// kanupdate lmap bclients jdod
	if len(newClients) > 0 {
		h.users[client.UserID] = newClients
	} else {
		// ila ma b9a hata client, kan7aydo user mn lmap
		delete(h.users, client.UserID)
	}
}

// Notify when user comes online
func (h *Hub) notifyUserOnline(userID int) {
	msg := &WebSocketMessage{
		Type:    "user_online",
		UserID:  userID,
		Sender:  userID,
		Content: "joined chat",
	}
	h.broadcastToOthers(msg, userID)
}

// Notify when user goes offline
func (h *Hub) notifyUserOffline(userID int) {
	msg := &WebSocketMessage{
		Type:    "user_offline",
		UserID:  userID,
		Sender:  userID,
		Content: "left chat",
	}
	h.broadcastToAll(msg)
}

// ========== MESSAGE BROADCASTING (SIMPLIFIED) ==========

// Send to all users except one
func (h *Hub) broadcastToOthers(msg *WebSocketMessage, excludeUserID int) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, clients := range h.users {
		if userID != excludeUserID {
			h.sendToUserClients(clients, msg)
		}
	}
}

// Send to all users
func (h *Hub) broadcastToAll(msg *WebSocketMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, clients := range h.users {
		h.sendToUserClients(clients, msg)
	}
}

// Send to specific user (all their connections)
func (h *Hub) sendToUser(msg *WebSocketMessage, userID int) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, exists := h.users[userID]; exists {
		h.sendToUserClients(clients, msg)
	}
}

// Helper to send message to multiple client connections
func (h *Hub) sendToUserClients(clients []*Client, msg *WebSocketMessage) {
	for _, client := range clients {
		select {
		case client.Send <- msg:
			// Sent successfully
		default:
			// Channel full or closed, will be cleaned up later
		}
	}
}

// ========== MAIN HUB LOOP (SIMPLIFIED) ==========

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			wasOnline := h.IsUserOnline(client.UserID)
			h.addClient(client)

			log.Printf("User %d connected. Online: %t -> %t",
				client.UserID, wasOnline, true)

			// Only notify if user just came online
			if !wasOnline {
				h.notifyUserOnline(client.UserID)
			}

		case client := <-h.unregister:
			wasOnline := h.IsUserOnline(client.UserID)
			h.removeClient(client)
			close(client.Send)

			isStillOnline := h.IsUserOnline(client.UserID)
			log.Printf("User %d disconnected. Online: %t -> %t",
				client.UserID, wasOnline, isStillOnline)

			// Only notify if user went completely offline
			if wasOnline && !isStillOnline {
				h.notifyUserOffline(client.UserID)
			}

		case msg := <-h.broadcast:
			if msg.Recipient > 0 {
				// Private message
				h.sendToUser(msg, msg.Recipient)
			} else {
				// Public message
				h.broadcastToAll(msg)
			}
		}
	}
}

// ========== WEBSOCKET CONNECTION HANDLING ==========

func (s *WebSocketService) CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error {
	// Upgrade connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return err
	}

	// Get user from session
	cookie, err := r.Cookie("session_token")
	if err != nil {
		conn.Close()
		return errors.New("missing session token")
	}

	userID, ok := s.sessRepo.GetSessionByToken(cookie.Value)
	if !ok {
		conn.Close()
		return errors.New("invalid session")
	}

	// Create client
	client := &Client{
		UserID: userID,
		Conn:   conn,
		Send:   make(chan *WebSocketMessage, 256),
	}

	// Register and start handling
	s.hub.register <- client
	go s.handleClient(client)

	return nil
}

// Handle client connection (read and write)
func (s *WebSocketService) handleClient(client *Client) {
	defer func() {
		s.hub.unregister <- client
		client.Conn.Close()
	}()

	// Start write pump in goroutine
	go s.writePump(client)

	// Read messages in main thread
	client.Conn.SetReadLimit(512)
	for {
		var msg WebSocketMessage
		if err := client.Conn.ReadJSON(&msg); err != nil {
			break
		}

		msg.Sender = client.UserID
		s.hub.broadcast <- &msg
	}
}

// Write messages to client
func (s *WebSocketService) writePump(client *Client) {
	defer client.Conn.Close()

	for msg := range client.Send {
		if err := client.Conn.WriteJSON(msg); err != nil {
			break
		}
	}
}

// Get all users with their online status
func (s *WebSocketService) GetAllUsersWithStatus() ([]*models.ChatUser, error) {
	users, err := s.userRepo.GetUsersRepo()
	if err != nil {
		return nil, err
	}

	chatUsers := make([]*models.ChatUser, len(users))
	for i, user := range users {
		chatUsers[i] = &models.ChatUser{
			Id:       user.Id,
			NickName: user.NickName,
			IsOnline: s.hub.IsUserOnline(user.Id),
		}
	}

	return chatUsers, nil
}
