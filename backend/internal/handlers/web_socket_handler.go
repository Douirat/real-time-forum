package handlers

import (
	"crypto/sha1"
	"encoding/base64"
	"log"
	"net/http"
	"real_time_forum/internal/services"
)

type WebSocketHandler struct {
	webServ services.WebSocketServiceLayer
}

// Instantiate the websocket object to ease working:
func NewWebSocketHandler(ws *services.WebSocketService) *WebSocketHandler {
	return &WebSocketHandler{webServ: ws}
}

// Create a handler to handle the duplex comunication between clients:
func (webSoc *WebSocketHandler) WebsocketHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.Header.Get("Upgrade") != "websocket" {
		http.Error(w, "Not WebSocket", http.StatusBadRequest)
		return
	}

	key := r.Header.Get("Sec-WebSocket-Key")
	accept := webSoc.computeAcceptKey(key)

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		http.Error(w, "Hijack not supported", http.StatusInternalServerError)
		return
	}

	conn, _, err := hijacker.Hijack()
	if err != nil {
		log.Println("Hijack error:", err)
		return
	}

	response := "HTTP/1.1 101 Switching Protocols\r\n" +
		"Upgrade: websocket\r\n" +
		"Connection: Upgrade\r\n" +
		"Sec-WebSocket-Accept: " + accept + "\r\n\r\n"
	conn.Write([]byte(response))

	go webSoc.webServ.HandleClient(conn)
}

func (webSoc *WebSocketHandler) computeAcceptKey(key string) string {
	magic := "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
	h := sha1.New()
	h.Write([]byte(key + magic))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}
