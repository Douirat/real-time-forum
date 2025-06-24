package models

// Create a structure to represent the user:
type User struct {
	Id        int    `json:"id"`
	NickName  string `json:"nick_name"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

// Create a model to ease working on chat
type ChatUser struct {
	Id          int    `json:"id"`
	NickName    string `json:"nick_name"`
	IsOnline    bool   `json:"is_online"`
	UnreadCount int    `json:"unread_count"`
}
