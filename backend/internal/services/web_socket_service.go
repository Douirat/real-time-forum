package services

import (
	"fmt"
	"log"
	"net/http"
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type WebSocketServiceLayer interface {
	HandleConnections(w http.ResponseWriter, r *http.Request)
}

type WebSocketService struct {
	upgrader    websocket.Upgrader
	clients     map[int]*websocket.Conn
	mu          sync.Mutex
	messageRepo repositories.MessageRepositoryLayer
	sessRepo    repositories.SessionsRepositoryLayer
}

// Message structure for WebSocket communication
type WebSocketMessage struct {
	Type    string `json:"type"`
	To      int    `json:"to"`
	Content string `json:"content"`
	From    string `json:"from,omitempty"`
}

// Constructor
func NewWebSocketService(messRepo repositories.MessageRepositoryLayer, sessRepo repositories.SessionsRepositoryLayer) *WebSocketService {
	return &WebSocketService{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
		clients:     make(map[int]*websocket.Conn),
		messageRepo: messRepo,
		sessRepo:    sessRepo,
	}
}

// Handle WebSocket connection
func (ws *WebSocketService) HandleConnections(w http.ResponseWriter, r *http.Request) {
	// Get session token from cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Missing session token", http.StatusUnauthorized)
		return
	}
	sessionToken := cookie.Value

	userID, ok := ws.sessRepo.GetSessionByToken(sessionToken)
	if !ok {
		http.Error(w, "Invalid session token", http.StatusUnauthorized)
		return
	}

	fmt.Printf("User %d connected to WebSocket\n", userID)

	conn, err := ws.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	// Register client
	ws.mu.Lock()
	ws.clients[userID] = conn
	ws.mu.Unlock()

	defer func() {
		ws.mu.Lock()
		delete(ws.clients, userID)
		ws.mu.Unlock()
		conn.Close()
		fmt.Printf("User %d disconnected from WebSocket\n", userID)
	}()

	// Send registration confirmation
	conn.WriteJSON(map[string]interface{}{
		"type":    "connected",
		"message": "Successfully connected to WebSocket",
		"user_id": userID,
	})

	for {
		var wsMsg WebSocketMessage
		err := conn.ReadJSON(&wsMsg)
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		log.Printf("Received WebSocket message: Type=%s, Content=%s, From=%d, To=%d", 
			wsMsg.Type, wsMsg.Content, userID, wsMsg.To)

		switch wsMsg.Type {
		case "register":
			// Handle registration (already done above)
			conn.WriteJSON(map[string]interface{}{
				"type":    "registered",
				"message": "User registered successfully",
			})

		case "message":
			// Handle message sending
			if wsMsg.Content == "" || wsMsg.To == 0 {
				conn.WriteJSON(map[string]interface{}{
					"type":  "error",
					"error": "Invalid message format",
				})
				continue
			}

			// Create message for database
			msg := &models.Message{
				Content:     wsMsg.Content,
				SenderId:    userID,
				RecieverId:  wsMsg.To,
				CreatedAt:   time.Now(),
				IsRead:      false,
			}

			// Store in database
			err = ws.messageRepo.InsertMessage(msg)
			if err != nil {
				log.Printf("Database error: %v", err)
				conn.WriteJSON(map[string]interface{}{
					"type":  "error",
					"error": "Failed to save message",
				})
				continue
			}

			// Get sender info for the message
			senderName := fmt.Sprintf("User_%d", userID) // You might want to get actual username

			// Prepare message for receiver
			receiverMsg := map[string]interface{}{
				"type":       "message",
				"content":    msg.Content,
				"from":       senderName,
				"from_id":    userID,
				"to":         wsMsg.To,
				"created_at": msg.CreatedAt.Format("2006-01-02 15:04:05"),
			}

			// Send to receiver if connected
			ws.mu.Lock()
			receiverConn, exists := ws.clients[wsMsg.To]
			ws.mu.Unlock()

			if exists {
				err = receiverConn.WriteJSON(receiverMsg)
				if err != nil {
					log.Printf("Error sending to receiver %d: %v", wsMsg.To, err)
				} else {
					log.Printf("Message sent to user %d", wsMsg.To)
				}
			} else {
				log.Printf("Receiver %d is not connected", wsMsg.To)
			}

			// Send confirmation to sender
			conn.WriteJSON(map[string]interface{}{
				"type":    "sent",
				"message": "Message sent successfully",
			})

		default:
			conn.WriteJSON(map[string]interface{}{
				"type":  "error",
				"error": "Unknown message type",
			})
		}
	}
}