package services

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"sync"

	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"

	"github.com/gorilla/websocket"
)

// Create a service layer for the web service:
type WebSocketServiceLayer interface {
	CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error
	GetAllUsersWithStatus() ([]*models.ChatUser, error)
	WebSocketLogout(token string) error
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
	UserId      int    `json:"user_id"`
	Sender      string `json:"sender"`
	Recipient   string `json:"recipient"`
	Content     string `json:"content"`
}

// create a client to represent the connected user with their websocket
// connection and a chanel to ease sending messages to that client withing the goroutine.
type Client struct {
	UserName string
	UserId   int
	Conn     *websocket.Conn
	Send     chan *WebSocketMessage
}

// Create a hub to maintain the set of active clients and broadcasts messages to them
// it acts as a central coordinator for all chat operations:
type Hub struct {
	Clients map[string]*Client

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
		Clients:    make(map[string]*Client),
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
			hub.Clients[client.UserName] = client
			log.Printf("Client %s connected. Total clients: %d", client.UserName, len(hub.Clients))

			onlineMessage := &WebSocketMessage{
				MessageType: "online",
				UserId:      client.UserId,
				Sender:      client.UserName,
				Content:     "joined chat",
			}

			// Broadcast to all the clients except the one who just joined:
			hub.BroadcastToOthers(onlineMessage, client.UserName)

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
					UserId:      client.UserId,
					Sender:      client.UserName,
					Content:     "left chat",
				}

				// broad cast the status to all users:
				hub.BroadcastToAll(offlineMessage)
			}

			// Handle message broadcasting:
		case message := <-hub.Broadcast:
			fmt.Println("Message: ", message)
			hub.SendToClient(message, message.Sender)

		}
	}
}

// Broadcast to all except the client in that  specific goroutine:
func (hub *Hub) BroadcastToOthers(message *WebSocketMessage, excluded string) {
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
func (hub *Hub) BroadcastToAll(message *WebSocketMessage) {
	for _, client := range hub.Clients {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(hub.Clients, client.UserName)
		}
	}
}


// Broadcast a message to a specific client:
func (hub *Hub) SendToClient(message *WebSocketMessage, receiver string) {
	if client, exist := hub.Clients[receiver]; exist {
		message.Sender = client.UserName
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

	// Get the user from database:
	user, err := soc.userRepo.GetUserByID(userId)
	if !ok {
		return errors.New("user doesn't exist")
	}

	// 	Create client:
	client := &Client{
		UserName: user.NickName,
		UserId:   user.Id,
		Conn:     conn,
		Send:     make(chan *WebSocketMessage),
	}

	// Register a new client to the hub:
	soc.chatBroker.Register <- client

	//
	go client.readPump(soc.chatBroker)
	go client.writePump()
	return nil
}

// read from the connection:
func (client *Client) readPump(hub *Hub) {
	// Ensure connection cleanup when this goroutine exits
	defer func() {
		hub.Unregister <- client
		client.Conn.Close()
	}()

	// Configure connection parameters
	client.Conn.SetReadLimit(512) // Max message size
	// Set read deadline and pong handler for keepalive
	client.Conn.SetPongHandler(func(string) error {
		return nil
	})

	// Main read loop - continuously read messages from client
	for {
		var msg = &WebSocketMessage{}
		// Read and decode JSON message from WebSocket
		err := client.Conn.ReadJSON(msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for %s: %v", client.UserName, err)
			}
			break
		}

		// Set sender to this client's username (prevent spoofing)
		msg.Sender = client.UserName

		log.Printf("Received message from %s: %+v", client.UserName, msg)

		// Send message to hub for routing
		hub.Broadcast <- msg
	}
}

func (client *Client) writePump() {
	defer client.Conn.Close()

	for {
		select {
		// Wait for message on send channel
		case message, ok := <-client.Send:
			if !ok {
				// Channel closed - send close message and exit
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Send JSON message to client
			if err := client.Conn.WriteJSON(message); err != nil {
				log.Printf("Write error for %s: %v", client.UserName, err)
				return
			}

			log.Printf("Sent message to %s: %+v", client.UserName, message)
		}
	}
}

func (ws *WebSocketService) GetAllUsersWithStatus() ([]*models.ChatUser, error) {
	users, err := ws.userRepo.GetUsersRepo()
	if err != nil {
		return nil, err
	}

	// Debug print that shows actual data, not memory addresses:
	for i, user := range users {
		fmt.Printf("User %d: ID=%d, Name=%s, Online=%t\n", i, user.Id, user.NickName, user.IsOnline)
	}

	fmt.Println("all logged users: ", ws.chatBroker.Clients)

	for _, user := range users {
		ws.chatBroker.mu.Lock()
		_, ok := ws.chatBroker.Clients[user.NickName]
		user.IsOnline = ok
		ws.chatBroker.mu.Unlock()
	}
	return users, nil
}

func (ws *WebSocketService) WebSocketLogout(token string) error {
	userId, ok := ws.sessRepo.GetSessionByToken(token)
	if !ok {
		return errors.New("session error")
	}

	// Get the user from database:
	user, err := ws.userRepo.GetUserByID(userId)
	if err != nil {
		return errors.New("user doesn't exist")
	}

	fmt.Println("the  user wants to logout: ", user)

	// 	Create client:
	client := &Client{
		UserName: user.NickName,
		UserId:   user.Id,
		Conn:     ws.chatBroker.Clients[user.NickName].Conn,
		Send:      ws.chatBroker.Clients[user.NickName].Send,
	}

	ws.chatBroker.Unregister <- client

	return nil
}
