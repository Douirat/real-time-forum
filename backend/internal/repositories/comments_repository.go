package repositories

import (
	"database/sql"
	"fmt"

	"real_time_forum/internal/models"
)

// Create a comments interface to hava a comments data layer:
type CommentsRepositoryLayer interface {
	MakeComment(comment *models.Comment) error
	ShowComments(id int) ([]*models.Comment, error)
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

// Show comments of a specific post:
func (commentsRepo *CommentsRepository) ShowComments(id int) ([]*models.Comment, error) {
	fmt.Println("CALLED", id)
	query := `SELECT * FROM comments WHERE post_id = ?`
	raws, err := commentsRepo.db.Query(query, id)
	if err != nil {
		return nil, err
	}
	var comments []*models.Comment
	for raws.Next() {
		comment := &models.Comment{}
		raws.Scan(&comment.Id, &comment.Content, &comment.AuthorID, &comment.PostId, &comment.CreatedAt)
		comments = append(comments, comment)
	}
	return comments, nil
}
