package models

import "time"

// create a message model to ease working with messages:
type Message struct {
	Id         int    `json:"id"`
	Content    string `json:"content"`
	SenderId   int    `json:"sender_id"`
	RecieverId int    `json:"reciever_id"`
	IsRead     bool   `json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
}

