package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
	"sync"

	"github.com/gorilla/websocket"
)

// Create an interface for the websocket service:
type WebSocketServiceLayer interface {
	AuthenticateUser(r *http.Request) (*models.User, error)
}

// Create a contractor the implement the websocket layer:
type WebSocketService struct {
	messRepo    repositories.MessageRepositoryLayer
	sessionRepo repositories.SessionsRepositoryLayer
	userRepo    repositories.UsersRepositoryLayer
}

// create an object to repesent the clint:
type Client struct {
	NickName string
	UserId   int
	Con      *websocket.Conn
	Send     chan []byte
}

// Create a structure to represent the message:
type Message struct {
	Sender   int    `json:"sender"`
	Receiver int    `json:"receiver"`
	Content  string `json:"content"`
	Type     string `json:"type"`
}

// Create a hub for clients togather to ease the chat process:
type Hub struct {
	Clients    map[int]*Client // username -> client
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *Message
	clientsMu  sync.RWMutex
	Database   *sql.DB
}

// Method to instantiate a new Hub:
func NewHub(db *sql.DB) *Hub {
	clients := &Hub{
		Clients:    make(map[int]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *Message),
		Database:   db,
	}
	return clients
}

// Instantiate the websocket service:
func NewWebSocketService(mesRepo *repositories.MessageRepository, sessRep *repositories.SessionsRepository, userRepo *repositories.UsersRepository) *WebSocketService {
	return &WebSocketService{
		messRepo:    mesRepo,
		sessionRepo: sessRep,
		userRepo:    userRepo,
	}
}

// Authentificate user from the websocket:
func (webSoc *WebSocketService) AuthenticateUser(r *http.Request) (*models.User, error) {
	var token string
	// Get session from cookie:
	if cookie, err := r.Cookie("session_token"); err == nil {
		token = cookie.Value
	}

	// validate session and get user id from db.
	userId, valid := webSoc.sessionRepo.GetSessionByToken(token)
	if !valid {
		log.Println("invalid session")
		return nil, fmt.Errorf("invalid session")
	}

	// Get user details;
	user, err := webSoc.userRepo.GetUserByID(userId)
	if err != nil {
		log.Println(err)
		return nil, err
	}
	return user, nil
}

// Run the web socket:
func (clients *Hub) RunWebSocket() {
	x := 0
	for {
		select {
		case client := <-clients.Register:

			clients.clientsMu.Lock()
			clients.Clients[client.UserId] = client
			// fmt.Println("clients: ---->", clients.Clients)
			clients.clientsMu.Unlock()
			clients.NotifyAllEccept(client.UserId, fmt.Sprintf("%s is online", client.NickName), "live")

		case client := <-clients.Unregister:

			clients.clientsMu.Lock()
			if _, ok := clients.Clients[client.UserId]; ok {
				delete(clients.Clients, client.UserId)
				close(client.Send)
				clients.NotifyAllEccept(client.UserId, fmt.Sprintf("%s has left", client.NickName), "offline")
			}
			clients.clientsMu.Unlock()

		case message := <-clients.Broadcast:
			fmt.Println("Message ...")
			clients.HandleMessage(message, clients)
		}

		for _, client := range clients.Clients {
			clients.MarkLiveUsers(client)
		}
		fmt.Println("x is: ", x)
		x++

	}
}

// Create a function to write into the network:
func (client *Client) WritePump() {
	defer client.Con.Close()
	for message := range client.Send {
		if err := client.Con.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Println(err)
			break
		}
	}
}

// Create a function to read from the websocket connection:
func (client *Client) ReadPump(clients *Hub) {
	defer func() {
		clients.Unregister <- client
		client.Con.Close()
	}()

	for {
		_, message, err := client.Con.ReadMessage()
		if err != nil {
			log.Println(err)
			break
		}
		msg := &Message{}
		if err := json.Unmarshal(message, msg); err == nil {
			msg.Sender = client.UserId
			fmt.Println(msg)
			clients.Broadcast <- msg
		}
	}
}

// Create a function to distribute online status and notification:
func (clients *Hub) NotifyAllEccept(excluded int, text string, notifiationType string) {
	notification := &Message{
		Type:     notifiationType,
		Sender:   excluded,
		Receiver: 0,
		Content:  text,
	}

	clients.clientsMu.RLock()
	defer clients.clientsMu.RUnlock()
	for id, client := range clients.Clients {
		if id != excluded {
			client.Send <- MarshalText(notification)
		}
	}
}

// Marshal text into json:
func MarshalText(value any) []byte {
	dataBytes, _ := json.Marshal(value)
	return dataBytes
}

// Create a function to handle the messages based on the :
func (hub *Hub) HandleMessage(message *Message, clients *Hub) {
	switch message.Type {
	case "message", "typing":
		hub.clientsMu.RLock()
		if target, ok := hub.Clients[message.Receiver]; ok {
			target.Send <- MarshalText(message)
		}
		hub.clientsMu.RUnlock()

	case "logout":
		hub.clientsMu.Lock()
		if user, ok := hub.Clients[message.Sender]; ok {
			delete(hub.Clients, message.Sender)
			close(user.Send)
			clients.NotifyAllEccept(message.Sender, fmt.Sprintf("%s has logged out", user.NickName), "logout")
		}
		hub.clientsMu.Unlock()
	}
}

// mark live users when the user logs in so he can see a tangible evidence of all the users that are live:
func (hub *Hub) MarkLiveUsers(client *Client) {
	for id, _ := range hub.Clients {
		notification := &Message{
			Type:     "live",
			Sender:   id,
			Receiver: 0,
			Content:  "user loged in",
		}
		if client.UserId != id {
			client.Send <- MarshalText(notification)
		}
	}
}
