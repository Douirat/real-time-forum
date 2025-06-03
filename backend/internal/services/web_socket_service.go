package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
	"real_time_forum/internal/services/utils"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type WebSocketServiceLayer interface {
	HandleConnections(w http.ResponseWriter, r *http.Request)
	GetAllUsersWithStatus() ([]*models.ChatUser, error)
	Shutdown(ctx context.Context) error
}

type WebSocketService struct {
	upgrader    websocket.Upgrader
	clients     map[int]*Client
	mu          sync.RWMutex
	messageRepo repositories.MessageRepositoryLayer
	sessRepo    repositories.SessionsRepositoryLayer
	userRepo    repositories.UsersRepositoryLayer

	// Channels for coordinating goroutines
	broadcast  chan BroadcastMessage
	register   chan *Client
	unregister chan *Client
	shutdown   chan struct{}
	wg         sync.WaitGroup
}

type Client struct {
	conn   *websocket.Conn
	userID int
	send   chan []byte
	ws     *WebSocketService
}

type WebSocketMessage struct {
	Type    string `json:"type"`
	To      int    `json:"to"`
	Content string `json:"content"`
	From    string `json:"from,omitempty"`
}

type BroadcastMessage struct {
	Type      string
	Data      interface{}
	TargetIDs []int
	ExcludeID int
}

func NewWebSocketService(messRepo repositories.MessageRepositoryLayer, sessRepo repositories.SessionsRepositoryLayer, userRepo repositories.UsersRepositoryLayer) *WebSocketService {
	ws := &WebSocketService{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Adjust origin checking as needed
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
		clients:     make(map[int]*Client),
		messageRepo: messRepo,
		sessRepo:    sessRepo,
		userRepo:    userRepo,
		broadcast:   make(chan BroadcastMessage, 256),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		shutdown:    make(chan struct{}),
	}

	ws.wg.Add(1)
	go ws.run()

	return ws
}

func (ws *WebSocketService) run() {
	defer ws.wg.Done()

	for {
		select {
		case client := <-ws.register:
			ws.handleRegister(client)
		case client := <-ws.unregister:
			ws.handleUnregister(client)
		case message := <-ws.broadcast:
			ws.handleBroadcast(message)
		case <-ws.shutdown:
			ws.handleShutdown()
			return
		}
	}
}

func (ws *WebSocketService) handleRegister(client *Client) {
	ws.mu.Lock()
	ws.clients[client.userID] = client
	ws.mu.Unlock()

	log.Printf("User %d connected", client.userID)

	ws.broadcastUserStatus(client.userID, true)
}

func (ws *WebSocketService) handleUnregister(client *Client) {
	ws.mu.Lock()
	if _, ok := ws.clients[client.userID]; ok {
		delete(ws.clients, client.userID)
		close(client.send)
	}
	ws.mu.Unlock()

	log.Printf("User %d disconnected", client.userID)

	ws.broadcastUserStatus(client.userID, false)
}

func (ws *WebSocketService) handleBroadcast(message BroadcastMessage) {
	ws.mu.RLock()
	defer ws.mu.RUnlock()

	jsonData, err := json.Marshal(message.Data)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	for userID, client := range ws.clients {
		if userID == message.ExcludeID {
			continue
		}

		if message.TargetIDs != nil && !contains(message.TargetIDs, userID) {
			continue
		}

		select {
		case client.send <- jsonData:
		default:
			close(client.send)
			delete(ws.clients, userID)
		}
	}
}

func (ws *WebSocketService) handleShutdown() {
	ws.mu.Lock()
	defer ws.mu.Unlock()

	for _, client := range ws.clients {
		close(client.send)
	}
	ws.clients = make(map[int]*Client)
}

func (ws *WebSocketService) HandleConnections(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Missing session token", http.StatusUnauthorized)
		return
	}

	userID, ok := ws.sessRepo.GetSessionByToken(cookie.Value)
	if !ok {
		http.Error(w, "Invalid session token", http.StatusUnauthorized)
		return
	}

	conn, err := ws.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Upgrade error: %v", err)
		return
	}

	client := &Client{
		conn:   conn,
		userID: userID,
		send:   make(chan []byte, 256),
		ws:     ws,
	}

	ws.register <- client

	ws.wg.Add(2)
	go client.writePump()
	go client.readPump()

	utils.SendJSON(conn, "connected", map[string]interface{}{
		"message": "Connected successfully",
		"user_id": userID,
	})
}

func (c *Client) readPump() {
	defer func() {
		c.ws.unregister <- c
		c.conn.Close()
		c.ws.wg.Done()
	}()

	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg WebSocketMessage
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Read error: %v", err)
			}
			break
		}

		c.ws.wg.Add(1)
		go c.handleIncomingMessage(msg)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		c.ws.wg.Done()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleIncomingMessage(msg WebSocketMessage) {
	defer c.ws.wg.Done()

	switch msg.Type {
	case "message":
		c.handleChatMessage(msg)
	default:
		utils.SendJSON(c.conn, "error", map[string]interface{}{
			"error": "Unsupported message type",
		})
	}
}

func (c *Client) handleChatMessage(msg WebSocketMessage) {
	if msg.Content == "" || msg.To == 0 {
		utils.SendJSON(c.conn, "error", map[string]interface{}{
			"error": "Invalid message format",
		})
		return
	}

	// Validate session before processing message
	if !c.ws.validateSession(c.userID) {
		utils.SendJSON(c.conn, "error", map[string]any{
			"error": "Session expired. Please log in again.",
		})
		c.ws.unregister <- c // Force disconnect
		return
	}

	message := &models.Message{
		Content:    msg.Content,
		SenderId:   c.userID,
		RecieverId: msg.To,
		CreatedAt:  time.Now(),
		IsRead:     false,
	}

	c.ws.wg.Add(1)
	go func() {
		defer c.ws.wg.Done()

		if err := c.ws.messageRepo.InsertMessage(message); err != nil {
			log.Printf("Database error: %v", err)
			utils.SendJSON(c.conn, "error", map[string]interface{}{
				"error": "Failed to save message",
			})
			return
		}

		c.ws.broadcastLastMessage(c.userID, msg.To)
	}()

	receiverMsg := map[string]interface{}{
		"type":       "message",
		"content":    msg.Content,
		"from":       fmt.Sprintf("User_%d", c.userID),
		"from_id":    c.userID,
		"to":         msg.To,
		"created_at": message.CreatedAt.Format(time.RFC3339),
	}

	c.ws.broadcast <- BroadcastMessage{
		Type:      "message",
		Data:      receiverMsg,
		TargetIDs: []int{msg.To},
	}
}

func (ws *WebSocketService) broadcastUserStatus(userID int, online bool) {
	status := "user_offline"
	if online {
		status = "user_online"
	}

	ws.broadcast <- BroadcastMessage{
		Type: status,
		Data: map[string]interface{}{
			"type":    status,
			"user_id": userID,
		},
		ExcludeID: userID,
	}
}

func (ws *WebSocketService) broadcastLastMessage(senderID, receiverID int) {
	msg, err := ws.messageRepo.GetLastMessage(senderID, receiverID)
	if err != nil {
		log.Printf("Error getting last message: %v", err)
		return
	}

	lastMsg := map[string]interface{}{
		"type":       "last_message",
		"message":    msg.Content,
		"from_id":    msg.SenderId,
		"to_id":      msg.RecieverId,
		"is_read":    msg.IsRead,
		"created_at": msg.CreatedAt.Format(time.RFC3339),
	}

	ws.broadcast <- BroadcastMessage{
		Type:      "last_message",
		Data:      lastMsg,
		TargetIDs: []int{senderID, receiverID},
	}
}

func (ws *WebSocketService) GetAllUsersWithStatus() ([]*models.ChatUser, error) {
	users, err := ws.userRepo.GetUsersRepo()
	if err != nil {
		return nil, err
	}

	ws.mu.RLock()
	defer ws.mu.RUnlock()

	for _, user := range users {
		_, ok := ws.clients[user.Id]
		user.IsOnline = ok
	}

	return users, nil
}

func (ws *WebSocketService) Shutdown(ctx context.Context) error {
	close(ws.shutdown)

	done := make(chan struct{})
	go func() {
		ws.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func contains(slice []int, item int) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

func (ws *WebSocketService) validateSession(userID int) bool {
	ws.mu.RLock()
	defer ws.mu.RUnlock()

	// Check if client still exists in our connection map
	if _, ok := ws.clients[userID]; !ok {
		return false
	}

	// Additional check with session repository if needed
	// This ensures the session is still valid in the database
	if !ws.sessRepo.SessionExists(userID) {
		return false
	}

	return true
}
