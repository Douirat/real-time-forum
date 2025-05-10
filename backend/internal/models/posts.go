package models

import "time"

// Create a user object to represent the posts model:
type Post struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	// ImagePath string    `json:"image_path"`
	CreatedAt time.Time `json:"created_at"`
	UserId    int       `json:"user_id"`
}


