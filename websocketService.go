package services

import (
	"encoding/json"
	"log"
	"net"
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types for WebSocket communication
const (
	MessageTypeRegister = "register"
	MessageTypeMessage  = "message"
	MessageTypeOnline   = "online"
	MessageTypeOffline  = "offline"
)

// WebSocket message structure
type WSMessage struct {
	Type    string      `json:"type"`
	From    string      `json:"from,omitempty"`
	To      int         `json:"to,omitempty"`
	Content string      `json:"content,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// Client represents a connected user
type Client struct {
	UserID   int             `json:"user_id"`
	Username string          `json:"username"`
	Conn     *websocket.Conn `json:"-"`
	IsOnline bool            `json:"is_online"`
	LastSeen time.Time       `json:"last_seen"`
}

// WebSocket service interface
type WebSocketServiceLayer interface {
	HandleClient(token string, conn *websocket.Conn)
	GetOnlineUsers() []*Client
	IsUserOnline(userID int) bool
}

// WebSocket service implementation
type WebSocketService struct {
	clients     map[int]*Client // userID -> client
	clientsMu   sync.RWMutex
	messRepo    repositories.MessageRepositoryLayer
	sessionRepo repositories.SessionsRepositoryLayer
	userRepo    repositories.UsersRepositoryLayer
}

// Create new WebSocket service
func NewWebSocketService(
	messRepo repositories.MessageRepositoryLayer,
	sessionRepo repositories.SessionsRepositoryLayer,
	userRepo repositories.UsersRepositoryLayer,
) *WebSocketService {
	return &WebSocketService{
		clients:     make(map[int]*Client),
		messRepo:    messRepo,
		sessionRepo: sessionRepo,
		userRepo:    userRepo,
	}
}

// Handle new client connection
func (ws *WebSocketService) HandleClient(token string, conn *websocket.Conn) {
	// Validate session and get user
	userID, valid := ws.sessionRepo.GetSessionByToken(token)
	if !valid {
		log.Printf("Invalid session token: %s", token)
		conn.Close()
		return
	}

	user, err := ws.userRepo.GetUserByID(userID)
	if err != nil {
		log.Printf("Error getting user by ID %d: %v", userID, err)
		conn.Close()
		return
	}

	// Create client and add to online clients
	client := &Client{
		UserID:   user.Id,
		Username: user.NickName,
		Conn:     conn,
		IsOnline: true,
		LastSeen: time.Now(),
	}

	ws.addClient(client)
	log.Printf("User %s (ID: %d) connected", client.Username, client.UserID)

	// Send registration confirmation
	ws.sendToClient(client, WSMessage{
		Type: MessageTypeRegister,
		Data: map[string]interface{}{
			"status":   "connected",
			"user_id":  client.UserID,
			"username": client.Username,
		},
	})

	// Notify other users that this user is online
	ws.broadcastUserStatus(client, MessageTypeOnline)

	// Handle incoming messages
	ws.handleMessages(client)

	// Clean up when client disconnects
	ws.removeClient(client)
	ws.broadcastUserStatus(client, MessageTypeOffline)
	log.Printf("User %s (ID: %d) disconnected", client.Username, client.UserID)
}

// Handle incoming messages from client
func (ws *WebSocketService) handleMessages(client *Client) {
	defer client.Conn.Close()

	for {
		var msg WSMessage
		err := client.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for user %s: %v", client.Username, err)
			}
			break
		}

		// Update client's last seen time
		client.LastSeen = time.Now()

		switch msg.Type {
		case MessageTypeMessage:
			ws.handlePrivateMessage(client, msg)
		default:
			log.Printf("Unknown message type: %s from user %s", msg.Type, client.Username)
		}
	}
}

// Handle private message between users
func (ws *WebSocketService) handlePrivateMessage(sender *Client, msg WSMessage) {
	if msg.To == 0 || msg.Content == "" {
		log.Printf("Invalid message from %s: missing recipient or content", sender.Username)
		return
	}

	// Get recipient user info
	recipient, err := ws.userRepo.GetUserByID(msg.To)
	if err != nil {
		log.Printf("Error getting recipient user %d: %v", msg.To, err)
		return
	}

	// Check if recipient is online
	recipientClient := ws.getClientByUserID(msg.To)
	isRecipientOnline := recipientClient != nil && recipientClient.IsOnline

	// Create message model
	message := &models.Message{
		Content:    msg.Content,
		SenderId:   sender.UserID,
		RecieverId: recipient.Id,
		IsRead:     isRecipientOnline, // Mark as read if recipient is online
		CreatedAt:  time.Now(),
	}

	// Save message to database
	err = ws.messRepo.InsertMessage(message)
	if err != nil {
		log.Printf("Error saving message to database: %v", err)
		return
	}

	// Send message to recipient if online
	if isRecipientOnline {
		responseMsg := WSMessage{
			Type:    MessageTypeMessage,
			From:    sender.Username,
			Content: msg.Content,
			Data: map[string]interface{}{
				"sender_id":  sender.UserID,
				"message_id": message.Id,
				"timestamp":  message.CreatedAt.Format(time.RFC3339),
			},
		}
		ws.sendToClient(recipientClient, responseMsg)
		log.Printf("Message sent from %s to %s (online)", sender.Username, recipient.NickName)
	} else {
		log.Printf("Message saved from %s to %s (offline)", sender.Username, recipient.NickName)
	}
}

// Add client to active clients
func (ws *WebSocketService) addClient(client *Client) {
	ws.clientsMu.Lock()
	defer ws.clientsMu.Unlock()
	ws.clients[client.UserID] = client
}

// Remove client from active clients
func (ws *WebSocketService) removeClient(client *Client) {
	ws.clientsMu.Lock()
	defer ws.clientsMu.Unlock()
	if existingClient, exists := ws.clients[client.UserID]; exists && existingClient == client {
		existingClient.IsOnline = false
		delete(ws.clients, client.UserID)
	}
}

// Get client by user ID
func (ws *WebSocketService) getClientByUserID(userID int) *Client {
	ws.clientsMu.RLock()
	defer ws.clientsMu.RUnlock()
	return ws.clients[userID]
}

// Send message to specific client
func (ws *WebSocketService) sendToClient(client *Client, msg WSMessage) {
	if client == nil || client.Conn == nil {
		return
	}

	err := client.Conn.WriteJSON(msg)
	if err != nil {
		log.Printf("Error sending message to client %s: %v", client.Username, err)
		client.Conn.Close()
	}
}

// Broadcast user online/offline status to all clients
func (ws *WebSocketService) broadcastUserStatus(user *Client, statusType string) {
	statusMsg := WSMessage{
		Type: statusType,
		Data: map[string]interface{}{
			"user_id":  user.UserID,
			"username": user.Username,
			"status":   statusType,
		},
	}

	ws.clientsMu.RLock()
	defer ws.clientsMu.RUnlock()

	for _, client := range ws.clients {
		if client.UserID != user.UserID && client.IsOnline {
			ws.sendToClient(client, statusMsg)
		}
	}
}

// Get list of online users
func (ws *WebSocketService) GetOnlineUsers() []*Client {
	ws.clientsMu.RLock()
	defer ws.clientsMu.RUnlock()

	var onlineUsers []*Client
	for _, client := range ws.clients {
		if client.IsOnline {
			onlineUsers = append(onlineUsers, &Client{
				UserID:   client.UserID,
				Username: client.Username,
				IsOnline: client.IsOnline,
				LastSeen: client.LastSeen,
			})
		}
	}
	return onlineUsers
}

// Check if user is online
func (ws *WebSocketService) IsUserOnline(userID int) bool {
	ws.clientsMu.RLock()
	defer ws.clientsMu.RUnlock()

	client, exists := ws.clients[userID]
	return exists && client.IsOnline
}