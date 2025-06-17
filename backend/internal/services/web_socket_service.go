package services

import "github.com/gorilla/websocket"

// Create a structure to reperesent the message structure:
type WebsocketMessage struct {
	Type     string `json:"type"`
	Sender   int    `json:"sender"`
	Receiver int    `json:"receiver"`
	Content  string `json:"content"`
}

// Create a structure to represent the client:
type Client struct {
	UserId     int
	Connection *websocket.Conn
	Pipe       chan *WebsocketMessage
}

// Create a type to represent the the chat broker:
type ChatBroker struct {
	Clients map[int]*Client // A map of all the clients with the keys as the clients ids and values of adresses to the a specific client.
	Register chan *Client // A channel to comunicate a newly registered user.
	Unregister chan *Client // A channel to remove the client from the map.
}
