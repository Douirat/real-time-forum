package services

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"

	"github.com/gorilla/websocket"
)

// Create an interface for the websocket implementation:
type WebsocketSeviceLayer interface {
	CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error
	GetAllUsersWithStatus(id int) ([]*models.ChatUser, error)
}

// Create an implementer for the websoket contract:
type WebSocketService struct {
	Hub         *ChatBroker
	MessageRepo repositories.MessageRepositoryLayer
	SessionRepo repositories.SessionsRepositoryLayer
	UserRepo    repositories.UsersRepositoryLayer
}

// Create a structure to reperesent the message structure:
type WebsocketMessage struct {
	Type     string `json:"type"`
	Sender   int    `json:"sender"`
	Receiver int    `json:"receiver"`
	Content  string `json:"content"`
}

// Create a structure to represent the client:
type Client struct {
	UserId     int
	Connection *websocket.Conn
	Pipe       chan *WebsocketMessage
}

// Create a type to represent the the chat broker:
type ChatBroker struct {
	Mu         sync.RWMutex
	Clients    map[int]*Client
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *WebsocketMessage
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://localhost:8080"
	},
}

// Instantiate a new chat broker:
func NewChatBroker() *ChatBroker {
	return &ChatBroker{
		Clients:    make(map[int]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *WebsocketMessage),
	}
}

// Instantiate a new chat broker service:
func NewWebSocketService(hub *ChatBroker, messRepo *repositories.MessageRepository, sessRepo *repositories.SessionsRepository, userRepo *repositories.UsersRepository) *WebSocketService {
	return &WebSocketService{
		Hub:         hub,
		MessageRepo: messRepo,
		SessionRepo: sessRepo,
		UserRepo:    userRepo,
	}
}

// Create the function to write messages to the websocket:
// writePump handles outgoing messages to the WebSocket connection
// This runs in its own goroutine per client (e.g., Client B)
func (client *Client) WritePump() {
	// [Cleanup] Ensure connection is closed when loop ends
	defer client.Connection.Close()

	// [Start Sending] Continuously listen on the Send channel
	for {
		select {
		// [Hub ->> WritePumpB] Step 3: Wait for a message routed to this client
		case message, ok := <-client.Pipe:
			if !ok {
				// [Hub signals closure] Send a close message and terminate
				client.Connection.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// [WritePumpB ->> ClientB] Step 4: Send the message to the browser
			if err := client.Connection.WriteJSON(message); err != nil {
				log.Printf("Write error for %d: %v", client.UserId, err)
				return
			}

			log.Printf("Sent message to %d: %+v", client.UserId, message)
			// [ClientB ->> ClientB] Step 5 happens in browser's JS: `onmessage` event
		}
	}
}

// A function to read data from the websocket:
// readPump handles incoming messages from the WebSocket connection
// This runs in its own goroutine per client (e.g., Client A)
func (client *Client) ReadPump(hub *ChatBroker) {
	// [Cleanup] Ensures client is unregistered and connection closed on exit
	defer func() {
		hub.Unregister <- client
		client.Connection.Close()
	}()

	// [Connection Setup] Prevent oversized messages and enable keepalive
	client.Connection.SetReadLimit(512)
	client.Connection.SetPongHandler(func(string) error {
		return nil // Keep the connection alive on pong
	})

	// [Start Listening] Infinite loop to read messages from the client
	for {
		msg := &WebsocketMessage{}

		// [ClientA ->> ReadPumpA] Step 1: Read JSON message sent by Client A
		err := client.Connection.ReadJSON(msg)
		if err != nil {
			// Handle unexpected close errors
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for %d: %v", client.UserId, err)
			}
			break // Exit read loop on error
		}

		// [ReadPumpA ->> Hub] Step 2: Prepare message and send to hub
		msg.Sender = client.UserId // Prevent spoofing
		log.Printf("Received message from %d: %+v", client.UserId, msg)

		hub.Broadcast <- msg // Send message to the central Hub for routing
	}
}

// Run a vertual server like that specializes in websocket alone:
func (broker *ChatBroker) RunChatBroker() {
	for {
		select {
		// New client connection
		case client := <-broker.Register:
			broker.Mu.Lock()
			if _, exists := broker.Clients[client.UserId]; !exists {
				broker.Clients[client.UserId] = client
				log.Printf("[INFO] Client %d connected. Total: %d", client.UserId, len(broker.Clients))
			}
			broker.Mu.Unlock()

			// Notify others that a user joined
			broker.BroadcastToOthers(&WebsocketMessage{
				Type:     "online",
				Sender:   client.UserId,
				Content:  "joined the chat",
				Receiver: 0,
			}, client.UserId)

		// Client disconnected
		case client := <-broker.Unregister:
			broker.Mu.Lock()
			_, exists := broker.Clients[client.UserId]
			if exists {
				delete(broker.Clients, client.UserId)
				log.Printf("[INFO] Client %d disconnected. Remaining: %d", client.UserId, len(broker.Clients))
			}
			broker.Mu.Unlock()

			if exists {
				broker.BroadcastToAll(&WebsocketMessage{
					Type:     "offline",
					Sender:   client.UserId,
					Content:  "left the chat",
					Receiver: 0,
				})

				safeClose(client.Pipe)
			}

		// Handle broadcast messages
		case msg := <-broker.Broadcast:
			if msg.Receiver != 0 {
				// Private message
				broker.SendToClient(msg, msg.Receiver)
			} else {
				// Public broadcast
				broker.BroadcastToOthers(msg, msg.Sender)
			}
		}
	}
}

// Broadcast to all users:
func (broker *ChatBroker) BroadcastToAll(msg *WebsocketMessage) {
	broker.Mu.RLock()
	defer broker.Mu.RUnlock()

	for id, client := range broker.Clients {
		select {
		case client.Pipe <- msg:
		default:
			log.Printf("[WARN] Client %d not responding. Removing...", id)
			go broker.RemoveClient(id)
		}
	}
}

// broadcast to other users:
func (broker *ChatBroker) BroadcastToOthers(msg *WebsocketMessage, excludeId int) {
	broker.Mu.RLock()
	defer broker.Mu.RUnlock()

	for id, client := range broker.Clients {
		if id == excludeId {
			continue
		}
		select {
		case client.Pipe <- msg:
		default:
			log.Printf("[WARN] Client %d unreachable. Removing...", id)
			go broker.RemoveClient(id)
		}
	}
}

// Send to a speific user:
func (broker *ChatBroker) SendToClient(msg *WebsocketMessage, receiverId int) {
	broker.Mu.RLock()
	client, exists := broker.Clients[receiverId]
	broker.Mu.RUnlock()

	if !exists {
		log.Printf("[WARN] Receiver %d not found", receiverId)
		return
	}

	select {
	case client.Pipe <- msg:
	default:
		log.Printf("[WARN] Failed to send to client %d. Removing...", receiverId)
		go broker.RemoveClient(receiverId)
	}
}

// Remove a client from the hub when unregistered:
func (broker *ChatBroker) RemoveClient(id int) {
	broker.Mu.Lock()
	client, exists := broker.Clients[id]
	if exists {
		delete(broker.Clients, id)
	}
	broker.Mu.Unlock()

	if exists {
		log.Printf("[INFO] Cleaning up client %d", id)
		safeClose(client.Pipe)
	}
}

// Safe closing for channels:
func safeClose(ch chan *WebsocketMessage) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[ERROR] Panic closing channel: %v", r)
		}
	}()
	close(ch)
}

// Create a new websocket connection:
func (socket *WebSocketService) CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error {
	// 1. Method check
	if r.Method != http.MethodGet {
		return fmt.Errorf("method not allowed: %s", r.Method)
	}

	// 2. Upgrade the connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return fmt.Errorf("failed to upgrade connection: %v", err)
	}

	// Get the user id form the session:
	// Read session_token from cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return err
	}
	token := cookie.Value

	// Get user ID from session
	userId, err := socket.SessionRepo.GetSessionByToken(token)
	if err != nil {
		return err
	}

	// 3.Craete the client:
	client := &Client{
		UserId:     userId,
		Connection: conn,
		Pipe:       make(chan *WebsocketMessage),
	}

	// 4. register the user to my hub:
	socket.Hub.Register <- client

	go client.ReadPump(socket.Hub)
	go client.WritePump()

	return nil
}

// Get all users and the online status as well:
func (socket *WebSocketService) GetAllUsersWithStatus(id int) ([]*models.ChatUser, error) {
	users, err := socket.UserRepo.GetUsersRepo()
	if err != nil {
		return nil, err
	}
	socket.Hub.Mu.RLock() 
	defer socket.Hub.Mu.RUnlock()

	for _, user := range users {
		_, isOnline := socket.Hub.Clients[user.Id]

		if isOnline {
			user.IsOnline = isOnline
		}
	}
	return users, nil
}
