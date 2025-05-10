package repositories

import (
	"database/sql"

	"real_time_forum/internal/models"
)

type PostsRepositoryLayer interface {
	CreatePost(post *models.Post) error
}

type PostsRepository struct {
	db *sql.DB
}

// Create a new instance of the postRepo object:
func NewPostsRepository(database *sql.DB) *PostsRepository {
	return &PostsRepository{
		db: database,
	}
}

// Function to handle posts creations:
func (postRepository *PostsRepository) CreatePost(post *models.Post) error {
	query := `INSERT INTO posts(title, content, created_at, user_id) VALUES(?, ?, ?, ?)`
	_, err := postRepository.db.Exec(query, post.Title, post.Content, post.CreatedAt, post.UserId)
	return err
}
