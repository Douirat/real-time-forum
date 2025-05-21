package services

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"real_time_forum/internal/repositories"
	"sync"
)

// Declare the global varibles:
var (
	clients   = make(map[string]*Client) // username -> client
	clientsMu sync.Mutex
)

// Create an interface for the websocket service:
type WebSocketServiceLayer interface {
	HandleClient(conn net.Conn)
	readMessage(r *bufio.Reader) (string, error)
	writeMessage(w *bufio.Writer, message string) error
}

type WebSocketService struct {
	messRepo repositories.MessageRepositoryLayer
}

// Instantiate the websocket service:
func NewWebSocketService(mesRepo *repositories.MessageRepository) *WebSocketService {
	return &WebSocketService{messRepo: mesRepo}
}

// create an object to repesent the clint:
type Client struct {
	username string
	conn     net.Conn
	writer   *bufio.Writer
}

func (webSoc *WebSocketService) HandleClient(conn net.Conn) {
	var username string
	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	for {
		msg, err := webSoc.readMessage(reader)
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		var packet map[string]interface{}
		json.Unmarshal([]byte(msg), &packet)
		fmt.Println(packet)
		switch packet["type"] {
		case "register":
			username = packet["username"].(string)
			clientsMu.Lock()
			clients[username] = &Client{username, conn, writer}
			clientsMu.Unlock()
			log.Println(username, "joined")
		case "message":
			to := packet["to"].(string)
			content := packet["content"].(string)

			clientsMu.Lock()
			recipient, ok := clients[to]
			clientsMu.Unlock()
			if ok {
				data := map[string]interface{}{
					"type":    "message",
					"from":    username,
					"content": content,
				}
				jsonData, _ := json.Marshal(data)
				webSoc.writeMessage(recipient.writer, string(jsonData))
			} else {
				log.Println("Recipient", to, "not found")
			}
		}
	}

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
