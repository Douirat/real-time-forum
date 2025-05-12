package repositories

import (
	"database/sql"

	"real_time_forum/internal/models"
)

// Create a comments interface to hava a comments data layer:
type CommentsRepositoryLayer interface {
	MakeComment(comment *models.Comment) error
}

// Create a contract signer for the repo interface:
type CommentsRepository struct {
	db *sql.DB
}

// Instantiate a new comment repository:
func NewCommentsRepository(dbCon *sql.DB) *CommentsRepository {
	return &CommentsRepository{
		db: dbCon,
	}
}

// Create a comment to a post:
func (commentsRepo *CommentsRepository) MakeComment(comment *models.Comment) error {
	query := `INSERT INTO comments (content, author_id, post_id, created_at) VALUES (?, ?, ?, ?)`
	_, err := commentsRepo.db.Exec(query, comment.Content, comment.AuthorID, comment.PostId, comment.CreatedAt)
	return err
}
