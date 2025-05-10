package services

import (
	"fmt"
	"real_time_forum/internal/repositories"
	"real_time_forum/internal/services/utils"
	"time"
)

type SessionsServicesLayer interface {
	CreateSession(userID int) (string, time.Time, error)
	DestroySession(token string) error
	// ValidateSession(token string) (*model.Session, error)
	// CleanupExpiredSessions() error
}

type SessionService struct {
	SessionRepo repositories.SessionsRepositoryLayer
	UserRepo    repositories.UsersRepositoryLayer
}

func NewSessionsServices(userRepo repositories.UsersRepositoryLayer, sessionRepo repositories.SessionsRepositoryLayer) *SessionService {
	return &SessionService{
		UserRepo:    userRepo,
		SessionRepo: sessionRepo,
	}
}
// CreateSession generates a new session for the user:
func (sessionServ *SessionService) CreateSession(userID int) (string, time.Time, error) {
	// Check if user exists:
	_, err := sessionServ.UserRepo.GetUserByID(userID)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("invalid user: %w", err)
	}

	// Generate token:
	token, err := utils.GenerateRandomToken(32)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("error generating token: %w", err)
	}

	// Set expiration time:
	expiresAt := time.Now().Add(24 * time.Hour)

	// Save to database:
	err = sessionServ.SessionRepo.CreateSession(userID, token, expiresAt)
	if err != nil {
		return "", time.Time{}, err
	}
	return token, expiresAt, nil
}

// destroy session:
func (sessionServ *SessionService) DestroySession(token string) error {
	fmt.Println(token)
	return sessionServ.SessionRepo.DeleteSessionByToken(token)
}
