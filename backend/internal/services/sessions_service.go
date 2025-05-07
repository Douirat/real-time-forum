package services

import (
	"fmt"
	"real_time_forum/internal/repositories"
	"real_time_forum/internal/services/utils"
	"time"
)

type SessionsServicesLayer interface {
	CreateSession(userID int) (string, time.Time, error)
	// ValidateSession(token string) (*model.Session, error)
	// DestroySession(token string) error
	// CleanupExpiredSessions() error
}

type SessionService struct {
	SessionRepo repositories.SessionRepositoryLayer
	UserRepo    repositories.UsersRepositoryLayer
	TokenLength int // Length of session tokens
	SessionLife  time.Duration // How long sessions last
}

// CreateSession generates a new session for the user
func (sessionServ *SessionService) CreateSession(userID int) (string, time.Time, error) {
	// Check if user exists
	_, err := sessionServ.UserRepo.GetUserByID(userID)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("invalid user: %w", err)
	}

	// Generate token
	token, err := utils.GenerateRandomToken(sessionServ.TokenLength)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("error generating token: %w", err)
	}

	// Set expiration time
	expiresAt := time.Now().Add(sessionServ.SessionLife)

	// Save to database
	err = sessionServ.SessionRepo.CreateSession(userID, token, expiresAt)
	if err != nil {
		return "", time.Time{}, err
	}
	return token, expiresAt, nil
}
