package repositories

import (
	"database/sql"
	"real_time_forum/internal/models"
)

type PostsRepositoryLayer interface {
	CreatePost(post *models.PostUser) error
	GetAllPostsRepository(offset, limit int) ([]*models.PostUser, error)
	GetCategories() ([]*models.Categories, error)
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

	// Begin a transaction to ensure atomic operations
	tx, err := postRepository.db.Begin()
	if err != nil {
		return err
	}
	//check if error return to create
	defer tx.Rollback()
	// Execute the post creation query
	result, err := tx.Exec(query, post.Title, post.Content, post.CreatedAt, post.UserId)
	if err != nil {
		return err
	}

	// Get the newly created post ID
	postID, err := result.LastInsertId()
	if err != nil {
		return err
	}

	// Insert categories for the post if any are provided
	if len(post.Categories) > 0 {
		for _, categoryID := range post.Categories {
			_, err = tx.Exec(
				"INSERT INTO post_categories(post_id, category_id) VALUES (?, ?)",
				postID, categoryID,
			)
			if err != nil {
				return err
			}
		}
	}

	// Commit the transaction
	return tx.Commit()
}

// Create a method to get all posts from database:
func (postRepo *PostsRepository) GetAllPostsRepository(offset, limit int) ([]*models.PostUser, error) {
	query := `
		SELECT 
			p.ID,
			p.title,
			p.content,
			p.created_at,
			u.nick_name,
			GROUP_CONCAT(c.c_name) AS categories 
		FROM posts AS p 
		JOIN users AS u ON p.user_id = u.ID 
		LEFT JOIN post_categories AS pc ON pc.post_id = p.ID 
		LEFT JOIN categories AS c ON pc.category_id = c.ID 
		GROUP BY p.ID 
		ORDER BY p.created_at DESC 
		LIMIT ? OFFSET ?;
	`

	rows, err := postRepo.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.PostUser
	for rows.Next() {
		post := &models.PostUser{}
		var categoryNames sql.NullString

		err := rows.Scan(&post.ID, &post.Title, &post.Content, &post.CreatedAt, &post.UserName, &categoryNames)
		if err != nil {
			return nil, err
		}

		if categoryNames.Valid {
			post.Catego = categoryNames.String
		}
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

// Create a method to get all categories from database:
func (postRepo *PostsRepository) GetCategories() ([]*models.Categories, error) {
	query := `SELECT * FROM categories`

	rows, err := postRepo.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categ []*models.Categories
	for rows.Next() {
		cat := &models.Categories{}
		if err := rows.Scan(&cat.ID, &cat.Category); err != nil {
			return nil, err
		}
		categ = append(categ, cat)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return categ, nil
}
