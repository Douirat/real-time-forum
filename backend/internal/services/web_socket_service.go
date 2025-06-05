package services

import (
	"errors"
	"log"
	"net/http"
	"real_time_forum/internal/repositories"
	"sync"

	"github.com/gorilla/websocket"
)

// Create a service layer for the web service:
type WebSocketServiceLayer interface {
	CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error
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
}

// create a client to represent the connected user with their websocket
// connection and a chanel to ease sending messages to that client withing the goroutine.
type Client struct {
	UserId int
	Conn   *websocket.Conn
	Send   chan *WebSocketMessage
}

// Create a hub to maintain the set of active clients and broadcasts messages to them
// it acts as a central coordinator for all chat operations:
type Hub struct {
	Clients map[int]*Client

	// A mutex to control the race condition:
	mu sync.Mutex

	// A channel for registring a new client:
	Register chan *Client

	// A channel to unregister the user:
	Unregister chan *Client

	// Create a channel for broadcasting messages:
	Broadcast chan *WebSocketMessage
}

// upgrade:
// WebSocket upgrader configuration
// This handles the HTTP to WebSocket protocol upgrade
var upgrader = websocket.Upgrader{
	// Buffer sizes for read/write operations
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow connections from any origin (disable CORS for simplicity)
	// In production, you should specify allowed origins
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:8080"
	},
}

// Create qn instance from webSocket:
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
		Clients:    make(map[int]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *WebSocketMessage),
	}
}

// a function to run the main hub loop that handles all client management:
func (hub *Hub) Run() {
	for {
		select {
		// Handle the new client's registration:
		case client := <-hub.Register:
			// Add the client to our registry:
			hub.Clients[client.UserId] = client
			log.Printf("Client %s connected. Total clients: %d", client.UserId, len(hub.Clients))

			onlineMessage := &WebSocketMessage{
				MessageType: "online",
				Sender:      client.UserId,
				Content:     "joined chat",
			}

			// Broadcast to all the clients except the one who just joined:
			hub.BroadcastToOthers(onlineMessage, client.UserId)

			// Handle client disconnection:
		case client := <-hub.Unregister:
			// Check if client's exists in our registry:
			if _, ok := hub.Clients[client.UserName]; ok {
				delete(hub.Clients, client.UserName)
				close(client.Send)
				log.Printf("Client %s disconnected. Total clients: %d", client.UserName, len(hub.Clients))
				// Notify all remaining clients that this user went offline:
				offlineMessage := &WebSocketMessage{
					MessageType: "offline",
					Sender:      client.UserName,
					Content:     "joined chat",
				}

				// broad cast the status to all users:
				hub.BoadcastToAll(offlineMessage)
			}

			// Handle message broadcasting:
		case message := <-hub.Broadcast:
			hub.SendToClient(message, message.Sender)

		}
	}
}

// Broadcast to all except the client in that  specific goroutine:
func (hub *Hub) BroadcastToOthers(message *WebSocketMessage, excluded int) {
	for username, client := range hub.Clients {
		if username != excluded {
			select {
			case client.Send <- message:
				// Message sent successfully:
			default:
				close(client.Send)
				delete(hub.Clients, username)
			}
		}
	}
}

// Bradcast a message to all users:
func (hub *Hub) BoadcastToAll(message *WebSocketMessage) {
	for _, client := range hub.Clients {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(hub.Clients, client.UserId)
		}
	}
}

// Broadcast a message to a specific client:
func (hub *Hub) SendToClient(message *WebSocketMessage, receiver int) {
	if client, exist := hub.Clients[receiver]; exist {
		select {
		case client.Send <- message:
			// Message sent successfully:
		default:
			// Client unavailable clean up.
			delete(hub.Clients, receiver)
			close(client.Send)
		}
	}
}

// create a new websocket :
func (soc *WebSocketService) CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error {
	// Check if it's a WebSocket upgrade request

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return err
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Missing session token", http.StatusUnauthorized)
		return err
	}
	sessionToken := cookie.Value

	userId, ok := soc.sessRepo.GetSessionByToken(sessionToken)
	if !ok {
		return errors.New("session error")
	}

	// 	Create client:
	client := &Client{
		UserId: userId,
		Conn:   conn,
		Send:   make(chan *WebSocketMessage),
	}

	// Register a new client to the hub:
	soc.chatBroker.Register <- client

	return nil
}
