package services

import (
	"fmt"
	"real_time_forum/internal/repositories"
	"time"
)

type SessionServices interface {
	CreateSession(userID int) (string, time.Time, error)
	// ValidateSession(token string) (*model.Session, error)
	// DestroySession(token string) error
	// CleanupExpiredSessions() error
}

type SessionService struct {
	Repository repositories.SessionRepositoryLayer
	UserRepo   repositories.UsersRepositoryLayer
}

// CreateSession generates a new session for the user
func (sessionServ *SessionService) CreateSession(userID int) (string, time.Time, error) {
	// Check if user exists
	_, err := sessionServ.UserRepo.GetUserByID(userID)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("invalid user: %w", err)
	}

	// Generate token
	token, err := se.generateSessionToken()
	if err != nil {
		return "", time.Time{}, fmt.Errorf("error generating token: %w", err)
	}

	// Set expiration time
	expiresAt := time.Now().Add(ss.SessionLife)

	// Save to database
	err = ss.Repository.CreateSession(userID, token, expiresAt)
	if err != nil {
		return "", time.Time{}, err
	}
	return token, expiresAt, nil
}
