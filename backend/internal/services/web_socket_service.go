package services

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
	"sync"
	"time"
)

// Declare the global varibles:
var (
	clients   = make(map[string]*Client) // username -> client
	clientsMu sync.Mutex
)

// Create an interface for the websocket service:
type WebSocketServiceLayer interface {
	HandleClient(token string, conn net.Conn)
	readMessage(r *bufio.Reader) (string, error)
	writeMessage(w *bufio.Writer, message string) error
}

// Create a contractor the implement the websocket layer:
type WebSocketService struct {
	messRepo    repositories.MessageRepositoryLayer
	sessionRepo repositories.SessionsRepositoryLayer
	userRepo    repositories.UsersRepositoryLayer
}

// Instantiate the websocket service:
func NewWebSocketService(mesRepo *repositories.MessageRepository, sessRep *repositories.SessionsRepository, userRepo *repositories.UsersRepository) *WebSocketService {
	return &WebSocketService{
		messRepo:    mesRepo,
		sessionRepo: sessRep,
		userRepo:    userRepo,
	}
}

// create an object to repesent the clint:
type Client struct {
	username string
	userId   int
	conn     net.Conn
	writer   *bufio.Writer
}

func (webSoc *WebSocketService) HandleClient(token string, conn net.Conn) {
	var (
		username string
	)
	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	for {
		msg, err := webSoc.readMessage(reader)
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		var packet map[string]interface{}
		if err := json.Unmarshal([]byte(msg), &packet); err != nil {
			log.Println("Invalid JSON packet:", err)
			continue
		}

		var valid bool
		clientId, valid := webSoc.sessionRepo.GetSessionByToken(token)
		if !valid {
			log.Println("Invalid session token for", token)
			return
		}

		switch packet["type"] {
		case "register":
			// Get user by id from data base:
			user, err := webSoc.userRepo.GetUserByID(clientId)
			if err != nil {
				log.Println("Error finding the client: ", err)
				return
			}
			clientsMu.Lock()
			clients[username] = &Client{
				username: user.NickName,
				userId:   user.Id,
				conn:     conn,
				writer:   writer,
			}
			clientsMu.Unlock()

			log.Println(username, "registered with ID", user.Id)

		case "message":
			guestId := packet["to"].(float64)
			content := packet["content"].(string)

			// Get the guest from database by it's id:
			guest, err := webSoc.userRepo.GetUserByID(int(guestId))
			if err != nil {
				fmt.Println("error retiriving the client from database: ", err)
				return
			}

			clientsMu.Lock()
			recipient, recipientOnline := clients[guest.NickName]
			sender := clients[username]
			clientsMu.Unlock()

			if sender == nil {
				log.Println("Sender not found in clients map")
				continue
			}

			// Build message model
			message := &models.Message{
				Content:    content,
				SenderId:   sender.userId,
				RecieverId: guest.Id,
				IsRead:     recipientOnline,
				CreatedAt:  time.Now(),
			}
			if recipientOnline {
				message.RecieverId = recipient.userId
			} else {
				log.Println("Recipient", guest.NickName, "not online")
				// Optionally queue message for later delivery
			}

			// Save to database
			if err := webSoc.messRepo.InsertMessage(message); err != nil {
				log.Println("DB insert error:", err)
			}

			if recipientOnline {
				data := map[string]interface{}{
					"type":    "message",
					"from":    username,
					"content": content,
				}
				if jsonData, err := json.Marshal(data); err == nil {
					if err := webSoc.writeMessage(recipient.writer, string(jsonData)); err != nil {
						log.Println("Error sending message to recipient:", err)
					}
				}
			}

		default:
			log.Println("Unknown packet type:", packet["type"])
		}
	}

	// Handle disconnect
	clientsMu.Lock()
	delete(clients, username)
	clientsMu.Unlock()
	conn.Close()
	log.Println(username, "disconnected")
}

func (webSoc *WebSocketService) readMessage(r *bufio.Reader) (string, error) {
	header := make([]byte, 2)
	if _, err := r.Read(header); err != nil {
		return "", err
	}

	payloadLen := int(header[1] & 127)
	mask := make([]byte, 4)
	if _, err := r.Read(mask); err != nil {
		return "", err
	}

	data := make([]byte, payloadLen)
	if _, err := r.Read(data); err != nil {
		return "", err
	}

	for i := 0; i < payloadLen; i++ {
		data[i] ^= mask[i%4]
	}

	return string(data), nil
}

func (webSoc *WebSocketService) writeMessage(w *bufio.Writer, message string) error {
	payload := []byte(message)
	header := []byte{0x81, byte(len(payload))}
	w.Write(header)
	w.Write(payload)
	w.Flush()
	return nil
}
