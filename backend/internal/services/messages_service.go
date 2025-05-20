package services

import (
	"errors"
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
)

// Create messages' service interface:
type MessagesServiceLayer interface {
	GetChatHistoryService(id int, sessionValue string) ([]*models.Message, error)
}

// Create the employee that will execute the message sevice interface:
type MessagesService struct {
	messageRepo repositories.MessageRepositoryLayer
	sessRepo    repositories.SessionsRepositoryLayer
}

// Instantiate the message service:
func NewMessageService(messRep *repositories.MessageRepository, sessRepo *repositories.SessionsRepository) *MessagesService {
	return &MessagesService{messageRepo: messRep}
}

// Get all the messages between the client and the chosen user:
func (mesSer *MessagesService) GetChatHistoryService(id int, sessionValue string) ([]*models.Message, error) {
	// Get User_id by session:
	clientId, exist := mesSer.sessRepo.GetSessionByToken(sessionValue)
	if !exist {
		return nil, errors.New("user has no session")
	}
	return mesSer.messageRepo.GetChatHistory(clientId, id)
}
