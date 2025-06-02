package utils

import "github.com/gorilla/websocket"

func SendJSON(conn *websocket.Conn, messageType string, data map[string]any) error {
	data["type"] = messageType
	return conn.WriteJSON(data)
}
