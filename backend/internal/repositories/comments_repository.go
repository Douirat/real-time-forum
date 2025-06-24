package repositories

import (
	"database/sql"

	"real_time_forum/internal/models"
)

// Create a comments interface to hava a comments data layer:
type CommentsRepositoryLayer interface {
	MakeComment(comment *models.Comment) error
	ShowComments(id, offset, limit int) ([]*models.Comment, error)
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
func (commentsRepo *CommentsRepository) ShowComments(id, offset, limit int) ([]*models.Comment, error) {
	query := `SELECT
	 c.ID ,
	 c.content,
	 c.author_id,
	 c.post_id,
	 c.created_at,
	 u.nick_name
	 FROM comments AS c
	 JOIN users AS u
	 ON c.author_id=u.ID
	 WHERE post_id = ?
	 ORDER BY c.created_at DESC 
	 LIMIT ? OFFSET ?;
	`

	rows, err := commentsRepo.db.Query(query, id, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var comments []*models.Comment
	for rows.Next() {
		comment := &models.Comment{}
		rows.Scan(&comment.Id, &comment.Content, &comment.AuthorID, &comment.PostId, &comment.CreatedAt, &comment.NickName)
		comments = append(comments, comment)
	}
	return comments, nil
}
