package models

// create a message model to ease working with messages:
type Message struct {
	Id         int    `json:"id"`
	Content    string `json:"content"`
	SenderId   int    `json:"sender_id"`
	RecieverId int    `json:"reciever_id"`
	IsRead     bool   `json:"is_read"`
	CreatedAt  string `json:"created_at"`
}

