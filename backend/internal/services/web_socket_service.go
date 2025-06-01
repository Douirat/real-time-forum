package services

import (
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
	"real_time_forum/internal/services/utils"
	"sync"
	"time"
)

type WebSocketServiceLayer interface {
	HandleConnections(w http.ResponseWriter, r *http.Request)
	GetAllUsersWithStatus() ([]*models.ChatUser, error)
}

type WebSocketService struct {
	upgrader    websocket.Upgrader
	clients     map[int]*websocket.Conn
	mu          sync.Mutex
	messageRepo repositories.MessageRepositoryLayer
	sessRepo    repositories.SessionsRepositoryLayer
	userRepo    repositories.UsersRepositoryLayer
}

// Message structure for WebSocket communication
type WebSocketMessage struct {
	Type    string `json:"type"`
	To      int    `json:"to"`
	Content string `json:"content"`
	From    string `json:"from,omitempty"`
}

// Constructor
func NewWebSocketService(messRepo repositories.MessageRepositoryLayer, sessRepo repositories.SessionsRepositoryLayer, userRepo repositories.UsersRepositoryLayer) *WebSocketService {
	return &WebSocketService{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				return origin == "http://localhost:8080"
			},
		},
		clients:     make(map[int]*websocket.Conn),
		messageRepo: messRepo,
		sessRepo:    sessRepo,
		userRepo:    userRepo,
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

	//is online
	ws.broadcastUserStatus(userID, true)

	defer func() {
		ws.mu.Lock()
		delete(ws.clients, userID)
		ws.mu.Unlock()
		conn.Close()
		//ofline
		ws.broadcastUserStatus(userID, false)
		fmt.Printf("User %d disconnected from WebSocket\n", userID)
	}()

	// Send registration confirmation
	utils.SendJSON(conn, "connected", map[string]any{"message": "Successfully connected to WebSocket", "user_id": userID})

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
		// case "register":
		// 	// Handle registration (already done above)
		// 	conn.WriteJSON(map[string]interface{}{
		// 		"type":    "registered",
		// 		"message": "User registered successfully",
		// 	})

		case "message":
			// Handle message sending
			if wsMsg.Content == "" || wsMsg.To == 0 {
				utils.SendJSON(conn, "error", map[string]any{"error": "Invalid message format"})
				continue
			}

			// Create message for database
			msg := &models.Message{
				Content:    wsMsg.Content,
				SenderId:   userID,
				RecieverId: wsMsg.To,
				CreatedAt:  time.Now(),
				IsRead:     false,
			}

			// Store in database
			err = ws.messageRepo.InsertMessage(msg)
			if err != nil {
				log.Printf("Database error: %v", err)
				utils.SendJSON(conn, "error", map[string]any{"error": "Failed to save message"})
				continue
			}

			// Broadcast the last message to both sender and receiver
			ws.broadcastLastMessage(userID, wsMsg.To)

			// Get sender info for the message
			senderName := fmt.Sprintf("User_%d", userID) // You might want to get actual username

			// Prepare message for receiver
			receiverMsg := map[string]any{
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
			utils.SendJSON(conn, "sent", map[string]any{"message": "Message sent successfully"})

		default:
			utils.SendJSON(conn, "error", map[string]any{"error": "Unknown message type"})
		}
	}
}

func (ws *WebSocketService) GetAllUsersWithStatus() ([]*models.ChatUser, error) {
	users, err := ws.userRepo.GetUsersRepo()
	if err != nil {
		return nil, err
	}

	ws.mu.Lock()
	defer ws.mu.Unlock()

	for _, user := range users {
		_, ok := ws.clients[user.Id]
		user.IsOnline = ok
	}
	return users, nil
}

func (ws *WebSocketService) broadcastUserStatus(userID int, isOnline bool) {
	statusType := "user_offline"
	if isOnline {
		statusType = "user_online"
	}

	message := map[string]any{
		"type":    statusType,
		"user_id": userID,
	}

	ws.mu.Lock()
	defer ws.mu.Unlock()

	for clientID, conn := range ws.clients {
		if clientID != userID {
			err := conn.WriteJSON(message)
			if err != nil {
				log.Printf("Error broadcasting status to user %d: %v", clientID, err)
				delete(ws.clients, clientID)
				conn.Close()
			}
		}
	}

	log.Printf("Broadcasted %s status for user %d to %d clients", statusType, userID, len(ws.clients)-1)
}

func (ws *WebSocketService) broadcastLastMessage(senderID, receiverID int) {
	msg, err := ws.messageRepo.GetLastMessage(senderID, receiverID)
	if err != nil {
		log.Printf("Error fetching last message: %v", err)
		return
	}

	lastMsg := map[string]any{
		"type":       "last_message",
		"message":    msg.Content,
		"from_id":    msg.SenderId,
		"to_id":      msg.RecieverId,
		"is_read":    msg.IsRead,
		"created_at": msg.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	ws.mu.Lock()
	defer ws.mu.Unlock()

	for _, id := range []int{senderID, receiverID} {
		if conn, ok := ws.clients[id]; ok {
			err := conn.WriteJSON(lastMsg)
			if err != nil {
				log.Printf("Error sending last message to user %d: %v", id, err)
				conn.Close()
				delete(ws.clients, id)
			}
		}
	}
}
