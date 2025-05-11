package services

import (
	"errors"
	"fmt"
	"time"

	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
)

// Create an interface for the posts services:
type PostsServiceLayer interface {
	CreatePost(post *models.Post, token string) error
}

// Create a structure to implement the functionalities
// within our interface contract:
type PostsService struct {
	PostRepo    repositories.PostsRepositoryLayer
	SessionRepo repositories.SessionsRepositoryLayer
}

// Instantiate a new postService instance:
func NewPostService(postRepo *repositories.PostsRepository, sessRepo *repositories.SessionsRepository) *PostsService {
	return &PostsService{
		PostRepo:    postRepo,
		SessionRepo: sessRepo,
	}
}

// Create a new post server:
func (postSer *PostsService) CreatePost(post *models.Post, token string) error {
	if post.Title == "" || post.Content == "" {
		return errors.New("missing content or title")
	}
	post.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	post.UserId, _ = postSer.SessionRepo.GetSessionByToken(token)
	fmt.Println("--------> ", post)
	return postSer.PostRepo.CreatePost(post)
}
