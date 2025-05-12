package models

// Create the comment model:
type Comment struct {
	Id        int    `json:"id"`
	Content   string `json:"content"`
	AuthorID  int    `json:"author_id"`
	PostId    int    `json:"post_id"`
	CreatedAt string `json:"created_at"`
}
