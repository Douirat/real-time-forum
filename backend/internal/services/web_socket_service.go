package services

import (
	"errors"
	"log"
	"net/http"
	"sync"
	"time"

	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"

	"github.com/gorilla/websocket"
)

// Service interface - Added MarkMessagesAsRead method
type WebSocketServiceLayer interface {
	CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error
	GetAllUsersWithStatus(id int) ([]*models.ChatUser, error)
}

// Main service struct
type WebSocketService struct {
	hub         *Hub
	messageRepo repositories.MessageRepositoryLayer
	sessRepo    repositories.SessionsRepositoryLayer
	userRepo    repositories.UsersRepositoryLayer
}

// Message structure - Updated to include mark_as_read type
type WebSocketMessage struct {
	Type      string `json:"type"`
	From      int    `json:"from"`  
	To        int    `json:"to"`      
	Sender    int    `json:"sender"`    
	Recipient int    `json:"recipient"` 
	Content   string `json:"content"`
	UserID    int    `json:"user_id,omitempty"`
	IsRead    bool   `json:"is_read"`
}

// Client represents a connected user:
type Client struct {
	UserID int
	Conn   *websocket.Conn
	Send   chan *WebSocketMessage
}

// Hub manages all connections and online status:
type Hub struct {
	users map[int][]*Client
	mu    sync.RWMutex
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

// ========== MARK MESSAGES AS READ IMPLEMENTATION ==========
// Internal method to mark messages as read - takes specific parameters
func (s *WebSocketService) markMessagesAsRead(senderID, receiverID int) error {
	// Mark messages as read in database
	if err := s.messageRepo.MarkMessagesAsRead(senderID, receiverID); err != nil {
		log.Printf("Error marking messages as read in DB: %v", err)
		return err
	}

	log.Printf("Messages marked as read: from user %d to user %d", senderID, receiverID)

	// Optional: Notify sender that their messages were read
	readNotification := &WebSocketMessage{
		Type:    "messages_read",
		From:    receiverID,
		To:      senderID,
		Content: "messages_marked_as_read",
		IsRead:  true,
	}

	s.hub.sendToUser(readNotification, senderID)

	return nil
}

// ========== ONLINE/OFFLINE MANAGEMENT ==========
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

	clients := h.users[client.UserID]
	newClients := []*Client{}
	for _, c := range clients {
		if c != client {
			newClients = append(newClients, c)
		}
	}

	if len(newClients) > 0 {
		h.users[client.UserID] = newClients
	} else {
		delete(h.users, client.UserID)
	}
}

// Notify when user comes online
func (h *Hub) notifyUserOnline(userID int) {
	msg := &WebSocketMessage{
		Type:    "user_online",
		UserID:  userID,
		From:    userID,
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
		From:    userID,
		Sender:  userID,
		Content: "left chat",
	}
	h.broadcastToOthers(msg, userID)
}

// ========== MESSAGE BROADCASTING ==========
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

// ========== MAIN HUB LOOP ==========

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
			switch msg.Type {
			case "message": // Handle frontend's "message" type
				// This is a private message if To/Recipient is specified
				if msg.To > 0 || msg.Recipient > 0 {
					recipientID := msg.To
					if recipientID == 0 {
						recipientID = msg.Recipient
					}
					// Send to recipient
					h.sendToUser(msg, recipientID)
					// Send back to sender for confirmation
					h.sendToUser(msg, msg.From)
				} else {
					// Public message - broadcast to all
					h.broadcastToAll(msg)
				}
			default:
				// Default behavior - broadcast to all
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

	userID, err := s.sessRepo.GetSessionByToken(cookie.Value)
	if err != nil {
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

	// Start both pumps
	go s.writePump(client)
	go s.readPump(client)

	return nil
}

// READ PUMP - Handle incoming messages from client
func (s *WebSocketService) readPump(client *Client) {
	defer func() {
		s.hub.unregister <- client
		client.Conn.Close()
	}()

	// Set read limit and deadlines
	client.Conn.SetReadLimit(512)
	client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg WebSocketMessage
		if err := client.Conn.ReadJSON(&msg); err != nil {
			log.Printf("Error reading message from client %d: %v", client.UserID, err)
			break
		}

		// Set sender information
		msg.From = client.UserID
		msg.Sender = client.UserID

		log.Printf("Received message: Type=%s, From=%d, To=%d, Content=%s",
			msg.Type, msg.From, msg.To, msg.Content)

		// ========== HANDLE MARK AS READ MESSAGE ==========
		if msg.Type == "mark_as_read" {
			// When user opens a conversation, mark messages FROM the other user TO current user as read
			if msg.To > 0 {
				// client.UserID is the receiver (current user)
				// msg.To is the sender whose messages we want to mark as read
				if err := s.markMessagesAsRead(msg.To, client.UserID); err != nil {
					log.Printf("Error marking messages as read: %v", err)
				}
			}
			continue // Don't broadcast this message type:
		}

		// **SAVE PRIVATE MESSAGES TO DATABASE**
		if msg.Type == "message" && (msg.To > 0 || msg.Recipient > 0) {
			recipientID := msg.To
			if recipientID == 0 {
				recipientID = msg.Recipient
			}

			// Save message with IsRead: false (recipient hasn't seen it yet)
			if err := s.savePrivateMessage(&msg, recipientID); err != nil {
				log.Printf("Error saving private message: %v", err)
				// Continue processing even if save fails
			}
		}

		// Send to hub for broadcasting
		s.hub.broadcast <- &msg
	}
}

// WRITE PUMP - Send messages to client
func (s *WebSocketService) writePump(client *Client) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// Channel was closed
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := client.Conn.WriteJSON(msg); err != nil {
				log.Printf("Error writing message to client %d: %v", client.UserID, err)
				return
			}

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Save private message to database
func (s *WebSocketService) savePrivateMessage(wsMsg *WebSocketMessage, recipientID int) error {
	// Create message model with IsRead: false (recipient hasn't seen it yet)
	message := &models.Message{
		Content:    wsMsg.Content,
		SenderId:   wsMsg.From, // Use From field from frontend
		RecieverId: recipientID,
		IsRead:     false, // Always false when saving - only true when recipient marks as read
		CreatedAt:  time.Now(),
	}

	// Save to database
	if err := s.messageRepo.InsertMessage(message); err != nil {
		return err
	}

	log.Printf("Private message saved: from %d to %d, content: %s, isRead: %t",
		wsMsg.From, recipientID, wsMsg.Content, message.IsRead)
	return nil
}

// Get all users with their online status (excluding self)
func (s *WebSocketService) GetAllUsersWithStatus(excludeID int) ([]*models.ChatUser, error) {
	users, err := s.userRepo.GetUsersRepo()
	if err != nil {
		return nil, err
	}

	chatUsers := []*models.ChatUser{}
	for _, user := range users {
		if user.Id == excludeID {
			continue // skip self
		}
		chatUsers = append(chatUsers, &models.ChatUser{
			Id:       user.Id,
			NickName: user.NickName,
			IsOnline: s.hub.IsUserOnline(user.Id),
		})
	}

	return chatUsers, nil
}
