package services

import (
	"fmt"
	"time"

	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
)

// Create an interface to represent the comment service:
type CommentsServicesLayer interface {
	MakeComments(comment *models.Comment, token string) error
}

// Create an object to function the functionalities of the my service layer:
type CommentsServices struct {
	commentsRepo repositories.CommentsRepositoryLayer
	sessRepo     repositories.SessionsRepositoryLayer
}

// Instantiate a new comments service object:
func NewCommentsServices(commRepo *repositories.CommentsRepository, sesRep *repositories.SessionsRepository) *CommentsServices {
	return &CommentsServices{
		commentsRepo: commRepo,
		sessRepo:     sesRep,
	}
}

// Make a comment service:
func (comServ *CommentsServices) MakeComments(comment *models.Comment, token string) error {
	// comment.AuthorID, _ = comServ.sessRepo.GetSessionByToken(token)
	fmt.Println("called  ====> ")
	comment.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	return comServ.commentsRepo.MakeComment(comment)
}
