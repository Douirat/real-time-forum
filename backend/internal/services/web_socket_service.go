package services

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

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
	defer func() {
		if client.Connection != nil {
			client.Connection.Close()
		}
	}()

	// [Start Sending] Continuously listen on the Send channel
	for {
		select {
		// [Hub ->> WritePumpB] Step 3: Wait for a message routed to this client
		case message, ok := <-client.Pipe:
			if !ok {
				// [Hub signals closure] Send a close message and terminate
				if client.Connection != nil {
					client.Connection.WriteMessage(websocket.CloseMessage, []byte{})
				}
				return
			}

			// [WritePumpB ->> ClientB] Step 4: Send the message to the browser
			if client.Connection != nil {
				if err := client.Connection.WriteJSON(message); err != nil {
					log.Printf("Write error for %d: %v", client.UserId, err)
					return
				}
				log.Printf("Sent message to %d: %+v", client.UserId, message)
			}
			// [ClientB ->> ClientB] Step 5 happens in browser's JS: `onmessage` event
		}
	}
}

// A function to read data from the websocket:
// readPump handles incoming messages from the WebSocket connection
// This runs in its own goroutine per client (e.g., Client A)
func (client *Client) ReadPump(hub *ChatBroker, socket *WebSocketService) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC] recovered in ReadPump for client %d: %v", client.UserId, r)
		}
		hub.Unregister <- client
		if client.Connection != nil {
			client.Connection.Close()
		}
	}()

	if client.Connection != nil {
		client.Connection.SetReadLimit(512)
		client.Connection.SetPongHandler(func(string) error { return nil })
	}

	for {
		msg := &WebsocketMessage{}

		if client.Connection == nil {
			break
		}

		err := client.Connection.ReadJSON(msg)
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("Client %d disconnected normally: %v", client.UserId, err)
			} else if websocket.IsUnexpectedCloseError(err, websocket.CloseAbnormalClosure) {
				log.Printf("[ERROR] Unexpected websocket close for client %d: %v", client.UserId, err)
			} else {
				log.Printf("[ERROR] ReadJSON error for client %d: %v", client.UserId, err)
			}
			_ = client.Connection.Close() // Close immediately on error
			break
		}

		msg.Sender = client.UserId
		log.Printf("Received message from %d: %+v", client.UserId, msg)

		message := &models.Message{
			Id:         0,
			Content:    msg.Content,
			SenderId:   msg.Sender,
			RecieverId: msg.Receiver,
			IsRead:     false,
			// CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
			CreatedAt: time.Now(),
		}

		if msg.Type == "message" {
			err = socket.MessageRepo.InsertMessage(message)
			if err != nil {
				log.Printf("[ERROR] Failed to insert message from client %d: %v", client.UserId, err)
				_ = client.Connection.Close() // Close connection on DB error too
				break
			}
		}
		hub.Broadcast <- msg
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
		if client == nil || client.Pipe == nil {
			continue
		}
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
		if id == excludeId || client == nil || client.Pipe == nil {
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

	if !exists || client == nil || client.Pipe == nil {
		log.Printf("[WARN] Receiver %d not found or invalid", receiverId)
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

	if exists && client != nil {
		log.Printf("[INFO] Cleaning up client %d", id)
		// Close connection first
		if client.Connection != nil {
			client.Connection.Close()
		}
		// Then safely close the channel
		safeClose(client.Pipe)
	}
}

// Safe closing for channels:
func safeClose(ch chan *WebsocketMessage) {
	// Check if channel is nil before attempting to close
	if ch == nil {
		return
	}

	defer func() {
		if r := recover(); r != nil {
			log.Printf("[ERROR] Panic closing channel: %v", r)
		}
	}()

	// Close the channel
	close(ch)
}

// Create a new websocket connection:
func (socket *WebSocketService) CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error {
	// 1. Method check
	if r.Method != http.MethodGet {
		return fmt.Errorf("method not allowed: %s", r.Method)
	}

	// 2. Get user authentication first (before upgrading connection)
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return fmt.Errorf("no session token: %v", err)
	}
	token := cookie.Value

	// Get user ID from session
	userId, err := socket.SessionRepo.GetSessionByToken(token)
	if err != nil {
		return fmt.Errorf("invalid session: %v", err)
	}

	// 3. Upgrade the connection only after authentication
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return fmt.Errorf("failed to upgrade connection: %v", err)
	}

	// 4. Create the client with proper channel initialization
	client := &Client{
		UserId:     userId,
		Connection: conn,
		Pipe:       make(chan *WebsocketMessage, 256), // Add buffer to prevent blocking
	}

	// 5. Register the user to hub
	socket.Hub.Register <- client

	// 6. Start goroutines
	go client.ReadPump(socket.Hub, socket)
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
		if user == nil {
			continue
		}
		_, isOnline := socket.Hub.Clients[user.Id]
		user.IsOnline = isOnline
	}

	return users, nil
}
