package services

import (
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// Create a service layer for the web service:
type WebSocketServiceLayer interface {
	NewChatBroker()
}

// Create a struct to implement the websocket service:
type WebSocketService struct {
	chatBroker *Hub
}

// create a struct to represent the message:
type WebSocketMessage struct {
	MessageType string `json:"type"`
	Sender      string `json:"sender"`
	Recipient   string `json:"recipient"`
	Content     string `json:"content"`
}

// create a client to represent the connected user with their websocket
// connection and a chanel to ease sending messages to that client withing the goroutine.
type Client struct {
	UserName string
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

// Instantiate the hub:
func (websoc *WebSocketService) NewChatBroker() {
	websoc.chatBroker = &Hub{
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
func (hub *Hub) BoadcastToAll(message *WebSocketMessage) {
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
