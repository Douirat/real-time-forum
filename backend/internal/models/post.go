package models

// Create a user object to represent the posts model:
type Post struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
	// ImagePath string    `json:"image_path"`
	CreatedAt string `json:"created_at"`
	UserId    int    `json:"user_id"`
}

type PostUser struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
	UserName  string `json:"user_name"`
	Categories int `json:"categories"`
}
