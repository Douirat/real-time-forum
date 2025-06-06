package services

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"

	"github.com/gorilla/websocket"
)

// Create a service layer for the web service:
type WebSocketServiceLayer interface {
	CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error
	GetAllUsersWithStatus() ([]*models.ChatUser, error)
}

// Create a struct to implement the websocket service:
type WebSocketService struct {
	chatBroker  *Hub
	messageRepo repositories.MessageRepositoryLayer
	sessRepo    repositories.SessionsRepositoryLayer
	userRepo    repositories.UsersRepositoryLayer
}

// create a struct to represent the message:
type WebSocketMessage struct {
	MessageType string `json:"type"`
	Sender      int    `json:"sender"`
	Recipient   int    `json:"recipient"`
	Content     string `json:"content"`
	UserID      int    `json:"user_id,omitempty"`
}

// create a client to represent the connected user with their websocket
// connection and a chanel to ease sending messages to that client withing the goroutine.
type Client struct {
	ID     string // Unique connection ID (UUID or timestamp-based)
	UserId int
	Conn   *websocket.Conn
	Send   chan *WebSocketMessage
}

// Create a hub to maintain the set of active clients and broadcasts messages to them
// it acts as a central coordinator for all chat operations:
type Hub struct {
	// Map of connection ID to client
	Clients map[string]*Client

	// Map of user ID to list of their connection IDs (for multiple tabs/windows)
	UserConnections map[int][]string

	// A mutex to control the race condition:
	mu sync.RWMutex

	// A channel for registring a new client:
	Register chan *Client

	// A channel to unregister the user:
	Unregister chan *Client

	// Create a channel for broadcasting messages:
	Broadcast chan *WebSocketMessage
}

// upgrade:
// WebSocket upgrader configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:8080"
	},
}

// Create an instance from webSocket:
func NewWebSocketService(broker *Hub, messRepo repositories.MessageRepositoryLayer, sessRepo repositories.SessionsRepositoryLayer, userRepo repositories.UsersRepositoryLayer) *WebSocketService {
	return &WebSocketService{
		chatBroker:  broker,
		messageRepo: messRepo,
		sessRepo:    sessRepo,
		userRepo:    userRepo,
	}
}

// Instantiate the hub:
func NewChatBroker() *Hub {
	return &Hub{
		Clients:         make(map[string]*Client),
		UserConnections: make(map[int][]string),
		Register:        make(chan *Client),
		Unregister:      make(chan *Client),
		Broadcast:       make(chan *WebSocketMessage),
	}
}

// Generate unique connection ID
func generateConnectionID(userID int) string {
	return fmt.Sprintf("%d_%d", userID, time.Now().UnixNano())
}

// Check if user has any active connections
func (hub *Hub) isUserOnline(userID int) bool {
	hub.mu.RLock()
	defer hub.mu.RUnlock()
	connections, exists := hub.UserConnections[userID]
	return exists && len(connections) > 0
}

// Get all connection IDs for a user
func (hub *Hub) getUserConnections(userID int) []string {
	hub.mu.RLock()
	defer hub.mu.RUnlock()
	if connections, exists := hub.UserConnections[userID]; exists {
		// Return a copy to avoid race conditions
		result := make([]string, len(connections))
		copy(result, connections)
		return result
	}
	return []string{}
}

// Add connection for user
func (hub *Hub) addUserConnection(userID int, connectionID string) {
	hub.mu.Lock()
	defer hub.mu.Unlock()

	if connections, exists := hub.UserConnections[userID]; exists {
		hub.UserConnections[userID] = append(connections, connectionID)
	} else {
		hub.UserConnections[userID] = []string{connectionID}
	}
}

// Remove connection for user
func (hub *Hub) removeUserConnection(userID int, connectionID string) {
	hub.mu.Lock()
	defer hub.mu.Unlock()

	if connections, exists := hub.UserConnections[userID]; exists {
		// Remove the connection ID from the slice
		for i, id := range connections {
			if id == connectionID {
				hub.UserConnections[userID] = append(connections[:i], connections[i+1:]...)
				break
			}
		}

		// If no more connections, remove the user entry
		if len(hub.UserConnections[userID]) == 0 {
			delete(hub.UserConnections, userID)
		}
	}
}

// Main hub loop that handles all client management:
func (hub *Hub) Run() {
	for {
		select {
		// Handle the new client's registration:
		case client := <-hub.Register:
			wasOnline := hub.isUserOnline(client.UserId)

			hub.mu.Lock()
			hub.Clients[client.ID] = client
			hub.mu.Unlock()

			hub.addUserConnection(client.UserId, client.ID)

			log.Printf("Client %s (User %d) connected. Total clients: %d",
				client.ID, client.UserId, len(hub.Clients))

			// Only broadcast "user came online" if this is their first connection
			if !wasOnline {
				onlineMessage := &WebSocketMessage{
					MessageType: "user_online",
					UserID:      client.UserId,
					Sender:      client.UserId,
					Content:     "joined chat",
				}
				hub.BroadcastToOthers(onlineMessage, client.UserId)
			}

		// Handle client disconnection:
		case client := <-hub.Unregister:
			hub.mu.Lock()
			if _, ok := hub.Clients[client.ID]; ok {
				delete(hub.Clients, client.ID)
				close(client.Send)
			}
			hub.mu.Unlock()

			hub.removeUserConnection(client.UserId, client.ID)

			log.Printf("Client %s (User %d) disconnected. Total clients: %d",
				client.ID, client.UserId, len(hub.Clients))

			// Only broadcast "user went offline" if this was their last connection
			if !hub.isUserOnline(client.UserId) {
				offlineMessage := &WebSocketMessage{
					MessageType: "user_offline",
					UserID:      client.UserId,
					Sender:      client.UserId,
					Content:     "left chat",
				}
				hub.BroadcastToAll(offlineMessage)
			}

		// Handle message broadcasting:
		case message := <-hub.Broadcast:
			if message.Recipient > 0 {
				// Send to specific user (all their connections)
				hub.SendToUser(message, message.Recipient)
			} else {
				// Broadcast to all users
				hub.BroadcastToAll(message)
			}
		}
	}
}

// Broadcast to all users except the specified user
func (hub *Hub) BroadcastToOthers(message *WebSocketMessage, excludedUserID int) {
	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for _, client := range hub.Clients {
		if client.UserId != excludedUserID {
			select {
			case client.Send <- message:
				// Message sent successfully
			default:
				// Client channel is full or closed, clean up
				go hub.cleanupClient(client)
			}
		}
	}
}

// Broadcast a message to all users
func (hub *Hub) BroadcastToAll(message *WebSocketMessage) {
	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for _, client := range hub.Clients {
		select {
		case client.Send <- message:
		default:
			// Client channel is full or closed, clean up
			go hub.cleanupClient(client)
		}
	}
}

// Send message to all connections of a specific user
func (hub *Hub) SendToUser(message *WebSocketMessage, userID int) {
	connectionIDs := hub.getUserConnections(userID)

	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for _, connectionID := range connectionIDs {
		if client, exists := hub.Clients[connectionID]; exists {
			select {
			case client.Send <- message:
				// Message sent successfully
			default:
				// Client channel is full or closed, clean up
				go hub.cleanupClient(client)
			}
		}
	}
}

// Clean up a problematic client connection
func (hub *Hub) cleanupClient(client *Client) {
	hub.mu.Lock()
	defer hub.mu.Unlock()

	if _, exists := hub.Clients[client.ID]; exists {
		delete(hub.Clients, client.ID)
		close(client.Send)
		hub.removeUserConnection(client.UserId, client.ID)
	}
}

// create a new websocket:
func (soc *WebSocketService) CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return err
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		conn.Close()
		return errors.New("missing session token")
	}
	sessionToken := cookie.Value

	userId, ok := soc.sessRepo.GetSessionByToken(sessionToken)
	if !ok {
		conn.Close()
		return errors.New("session error")
	}

	// Generate unique connection ID
	connectionID := generateConnectionID(userId)

	// Create client with unique ID:
	client := &Client{
		ID:     connectionID,
		UserId: userId,
		Conn:   conn,
		Send:   make(chan *WebSocketMessage, 256),
	}

	// Register the new client to the hub:
	soc.chatBroker.Register <- client

	// Start goroutines for this client
	go client.readPump(soc.chatBroker)
	go client.writePump()

	return nil
}

func (client *Client) readPump(hub *Hub) {
	defer func() {
		hub.Unregister <- client
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(512)
	client.Conn.SetPongHandler(func(string) error {
		return nil
	})

	for {
		var msg = &WebSocketMessage{}
		err := client.Conn.ReadJSON(msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for %s (User %d): %v", client.ID, client.UserId, err)
			}
			break
		}

		msg.Sender = client.UserId
		log.Printf("Received message from %s (User %d): %+v", client.ID, client.UserId, msg)

		hub.Broadcast <- msg
	}
}

func (client *Client) writePump() {
	defer client.Conn.Close()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := client.Conn.WriteJSON(message); err != nil {
				log.Printf("Write error for %s (User %d): %v", client.ID, client.UserId, err)
				return
			}

			log.Printf("Sent message to %s (User %d): %+v", client.ID, client.UserId, message)
		}
	}
}

func (soc *WebSocketService) GetAllUsersWithStatus() ([]*models.ChatUser, error) {
	users, err := soc.userRepo.GetUsersRepo()
	if err != nil {
		return nil, err
	}

	var chatUsers []*models.ChatUser

	for _, user := range users {
		chatUser := &models.ChatUser{
			Id:       user.Id,
			NickName: user.NickName,
			IsOnline: soc.chatBroker.isUserOnline(user.Id),
		}
		chatUsers = append(chatUsers, chatUser)
	}

	return chatUsers, nil
}
