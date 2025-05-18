package repositories

import (
	"database/sql"

	"real_time_forum/internal/models"
)

type PostsRepositoryLayer interface {
	CreatePost(post *models.PostUser) error
	GetAllPostsRepository() ([]*models.PostUser, error)
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
func (postRepository *PostsRepository) CreatePost(post *models.PostUser) error {
    query := "INSERT INTO posts(title, content, created_at, user_id) VALUES(?, ?, ?, ?)"
    result, err := postRepository.db.Exec(query, post.Title, post.Content, post.CreatedAt, post.UserId)
    if err != nil {
        return err
    }

    postID, err := result.LastInsertId()
    if err != nil {
        return err
    }
    // categoryID = 1
	for cat:=range post.Categories{
		_, err = postRepository.db.Exec(
			"INSERT INTO post_categories(post_id, category_id) VALUES (?, ?)",
			postID, cat,
		)
		return err
	} 
	return nil
}

// Create a method to get all posts from database:
func (postRepo *PostsRepository) GetAllPostsRepository() ([]*models.PostUser, error) {
	query := `
		SELECT 
			p.ID, 
			p.title, 
			p.content, 
			p.created_at, 
			u.nick_name
		FROM posts AS p
		INNER JOIN users AS u ON p.user_id = u.ID;
	`

	rows, err := postRepo.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.PostUser
	for rows.Next() {
		post := &models.PostUser{}
		if err := rows.Scan(&post.ID, &post.Title, &post.Content, &post.CreatedAt, &post.UserName); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

// Create a method to get all posts from database:
func (postRepo *PostsRepository) GetCategories() ([]*models.PostUser, error) {
	query := `SELECT `

	rows, err := postRepo.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.PostUser
	for rows.Next() {
		post := &models.PostUser{}
		if err := rows.Scan(&post.ID, &post.Title, &post.Content, &post.CreatedAt, &post.UserName); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}