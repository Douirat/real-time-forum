package services

import (
	"database/sql"

	"real_time_forum/internal/models"
)

// Create an interface for the posts services:
type PostsServiceLayer interface {
	CreatePost(post *models.Post) error
}

// Create a structure to implement the functionalities
// within our interface contract:
type PostsService struct {
	db *sql.DB
}

// 