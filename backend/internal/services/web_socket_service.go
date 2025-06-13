package services

import (
	"log"
	"net/http"
	"sync"

	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://localhost:8080"
	},
}

// Create a layer for the websocket:
type WebsocketSeviceLayer interface {
	CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error
	GetAllUsersWithStatus(excludeID int) ([]*models.ChatUser, error)
}

// Create an implementer for the websocket layer:
type WebsocketSevice struct {
	Hub         *ChatBroker
	MessageRepo repositories.MessageRepositoryLayer
	UserRepo    repositories.UsersRepositoryLayer
	SessionRepo repositories.SessionsRepositoryLayer
}

// Instantiate a new websocket service:
func NewWebsocketSevice(hub *ChatBroker, mesRepo *repositories.MessageRepository, userRepo *repositories.UsersRepository, sess *repositories.SessionsRepository) *WebsocketSevice {
	return &WebsocketSevice{
		Hub:         hub,
		MessageRepo: mesRepo,
		UserRepo:    userRepo,
		SessionRepo: sess,
	}
}

// Declare the necessary structures for the websocket:

// => Websocket message:
type WebsocketMessage struct {
	Type     string `json:"type"`
	Sender   int    `json:"sender"`
	Receiver int    `json:"receiver"`
	Content  string `json:"content"`
}

// => The client:
type Client struct {
	UserId     int
	Connection *websocket.Conn
	Send       chan *WebsocketMessage
}

// => The hub:
type ChatBroker struct {
	// a map for the user and all his related connections:
	Clients map[int][]*Client

	Register chan *Client

	Unregister chan *Client

	Broadcast chan *WebsocketMessage

	mu sync.RWMutex
}

// Create a new instance of the chat broker:
func NewChatBroker() *ChatBroker {
	return &ChatBroker{
		Clients:    make(map[int][]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *WebsocketMessage),
	}
}

// Create a new websocket:
func (soc WebsocketSevice) CreateNewWebSocket(w http.ResponseWriter, r *http.Request) error {
	// Upgrade the HTTP connection to a WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return err
	}

	// fallback => cookie:
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return err
	}

	// Get user from database:
	userId, err := soc.SessionRepo.GetSessionByToken(cookie.Value)
	if err != nil {
		return err
	}

	// Create the client:
	client := &Client{
		UserId:     userId,
		Connection: conn,
		Send:       make(chan *WebsocketMessage),
	}

	// Register a new user:
	soc.Hub.Register <- client

	go client.readPump(soc.Hub)
	go client.writePump()
	return nil
}

// readPump handles incoming messages from the WebSocket connection
// This runs in its own goroutine per client
func (c *Client) readPump(hub *ChatBroker) {
	// Ensure connection cleanup when this goroutine exits
	defer func() {
		hub.Unregister <- c
		c.Connection.Close()
	}()

	// Configure connection parameters
	c.Connection.SetReadLimit(512) // Max message size
	// Set read deadline and pong handler for keepalive
	c.Connection.SetPongHandler(func(string) error {
		return nil
	})

	// Main read loop - continuously read messages from client
	for {
		var msg *WebsocketMessage
		// Read and decode JSON message from WebSocket
		err := c.Connection.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for %d: %v", c.UserId, err)
			}
			break
		}

		// Set sender to this client's username (prevent spoofing)
		msg.Sender = c.UserId

		log.Printf("Received message from %d: %+v", c.UserId, msg)

		// Send message to hub for routing
		hub.Broadcast <- msg
	}
}

// writePump handles outgoing messages to the WebSocket connection
// This runs in its own goroutine per client
func (c *Client) writePump() {
	defer c.Connection.Close()

	for {
		select {
		// Wait for message on send channel
		case message, ok := <-c.Send:
			if !ok {
				// Channel closed - send close message and exit
				c.Connection.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Send JSON message to client
			if err := c.Connection.WriteJSON(message); err != nil {
				log.Printf("Write error for %d: %v", c.UserId, err)
				return
			}

			log.Printf("Sent message to %d: %+v", c.UserId, message)
		}
	}
}

// Run the chat broker:
func (hub *ChatBroker) RunChatBroker() {
	for {
		select {
		case client := <-hub.Register:
			hub.mu.Lock()
			hub.Clients[client.UserId] = append(hub.Clients[client.UserId], client)
			hub.mu.Unlock()

			onlineMessage := &WebsocketMessage{
				Type:    "online",
				Sender:  client.UserId,
				Content: "Joined chat",
			}
			// Broadcast to all clients except the one who just joined
			hub.broadcastToOthers(onlineMessage)
		case client := <-hub.Unregister:
			hub.mu.Lock()
			clients := hub.Clients[client.UserId]
			for i, c := range clients {
				if c == client {
					// Close the send channel to cleanup
					close(c.Send)

					// Remove the client from the slice
					hub.Clients[client.UserId] = append(clients[:i], clients[i+1:]...)
					offlineMsg := &WebsocketMessage{
						Type:    "offline",
						Sender:  client.UserId,
						Content: "left the chat",
					}
					hub.broadcastToAll(offlineMsg)
					break
				}
			}

			// If no clients left for the user, remove the map entry
			if len(hub.Clients[client.UserId]) == 0 {
				delete(hub.Clients, client.UserId)
			}

			hub.mu.Unlock()

			// broadcast logic here...
		case message := <-hub.Broadcast:

			if message.Receiver != 0 {
				// Private message - send only to specific recipient
				hub.sendToClient(message)
			} else {
				// Public message or status - broadcast to all clients except sender
				hub.broadcastToOthers(message)
			}

		}
	}
}

// Boroadcast to all users except one:
func (hub *ChatBroker) broadcastToOthers(message *WebsocketMessage) {
	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for _, clientList := range hub.Clients {
		for _, client := range clientList {
			if client.UserId != message.Sender {
				select {
				case client.Send <- message:
					// Message sent successfully
				default:
					// Client unavailable - handle cleanup
					go func(c *Client) {
						hub.mu.Lock()
						defer hub.mu.Unlock()

						// Close the send channel
						close(c.Send)

						// Remove client from the slice
						clients := hub.Clients[c.UserId]
						for i, cl := range clients {
							if cl == c {
								hub.Clients[c.UserId] = append(clients[:i], clients[i+1:]...)
								break
							}
						}

						// Remove map key if no clients left
						if len(hub.Clients[c.UserId]) == 0 {
							delete(hub.Clients, c.UserId)
						}
					}(client)
				}
			}
		}
	}
}

// broadcastToAll sends a message to all connected clients
func (hub *ChatBroker) broadcastToAll(message *WebsocketMessage) {
	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for userID, clients := range hub.Clients {
		for i := 0; i < len(clients); {
			client := clients[i]

			select {
			case client.Send <- message:
				// Sent successfully
				i++
			default:
				// Channel is blocked or closed → cleanup
				hub.mu.RUnlock()
				hub.mu.Lock()

				close(client.Send)

				// Remove client from slice
				hub.Clients[userID] = append(clients[:i], clients[i+1:]...)
				clients = hub.Clients[userID]

				// Delete map entry if no clients left
				if len(clients) == 0 {
					delete(hub.Clients, userID)
				}

				hub.mu.Unlock()
				hub.mu.RLock()
			}
		}
	}
}

// sendToClient sends a message to all active clients of a user by userID
func (hub *ChatBroker) sendToClient(message *WebsocketMessage) {
	hub.mu.RLock()
	clients, exists := hub.Clients[message.Receiver]
	hub.mu.RUnlock()

	if !exists {
		return
	}

	for i := 0; i < len(clients); {
		client := clients[i]
		select {
		case client.Send <- message:
			i++ // sent successfully
		default:
			// Cleanup if client's channel is blocked
			hub.mu.Lock()

			close(client.Send)
			hub.Clients[message.Receiver] = append(clients[:i], clients[i+1:]...)
			clients = hub.Clients[message.Receiver]

			if len(clients) == 0 {
				delete(hub.Clients, message.Receiver)
			}
			hub.mu.Unlock()
		}
	}
}

// Get all users with their online status (excluding self)
func (webSoc *WebsocketSevice) GetAllUsersWithStatus(excludeID int) ([]*models.ChatUser, error) {
	users, err := webSoc.UserRepo.GetUsersRepo()
	if err != nil {
		return nil, err
	}

	chatUsers := []*models.ChatUser{}
	webSoc.Hub.mu.RLock()         // 👈 Acquire read lock
	defer webSoc.Hub.mu.RUnlock() // 👈 Ensure unlock

	for _, user := range users {
		if user.Id == excludeID {
			continue // skip self
		}
		chatUsers = append(chatUsers, &models.ChatUser{
			Id:       user.Id,
			NickName: user.NickName,
			IsOnline: len(webSoc.Hub.Clients[user.Id]) >= 1,
		})
	}

	return chatUsers, nil
}
