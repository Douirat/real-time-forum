package services

import (
	"fmt"
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
)

// Create messages' service interface
type MessagesServiceLayer interface {
	GetChatHistoryService(id int, sessionValue string) ([]*models.Message, error)
}

// Create the employee that will execute the message service interface
type MessagesService struct {
	messageRepo repositories.MessageRepositoryLayer
	sessRepo    repositories.SessionsRepositoryLayer
}

// Instantiate the message service
func NewMessageService(messRep repositories.MessageRepositoryLayer, sessionRepo repositories.SessionsRepositoryLayer) *MessagesService {
	return &MessagesService{
		messageRepo: messRep,
		sessRepo:    sessionRepo,
	}
}

// Get all the messages between the client and the chosen user
func (mesSer *MessagesService) GetChatHistoryService(id int, sessionValue string) ([]*models.Message, error) {
	// Validate session token
	if sessionValue == "" {
		return nil, fmt.Errorf("session token is required")
	}

	// Get client ID from session token
	clientId, ok := mesSer.sessRepo.GetSessionByToken(sessionValue)
	if !ok {
		return nil, fmt.Errorf("invalid or expired session token")
	}

	// Validate user IDs
	if clientId <= 0 || id <= 0 {
		return nil, fmt.Errorf("invalid user IDs")
	}

	// Retrieve chat history between client and selected user
	messages, err := mesSer.messageRepo.GetChatHistory(clientId, id)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve chat history: %v", err)
	}

	return messages, nil
}