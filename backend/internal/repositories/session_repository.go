package repositories

import (
	"database/sql"
	"fmt"
	"time"
)

type SessionsRepositoryLayer interface {
	CreateSession(userID int, token string, expiresAt time.Time) error
	DeleteSessionByToken(token string) error
	GetSessionByToken(tocke string) (int, error)
}

type SessionsRepository struct {
	db *sql.DB
}

// Create a new instance from the user crepository structure:
func NewSessionsRepository(database *sql.DB) *SessionsRepository {
	sessionRepo := new(SessionsRepository)
	sessionRepo.db = database
	// return &UsersRepository{db: database}
	return sessionRepo
}

func (sr *SessionsRepository) CreateSession(userID int, token string, expiresAt time.Time) error {
	// First, delete any existing sessions for this user (optional)
	_, err := sr.db.Exec("DELETE FROM sessions WHERE user_id = ?", userID)
	if err != nil {
		return fmt.Errorf("error deleting existing sessions: %w", err)
	}

	// Create the new session
	_, err = sr.db.Exec(
		"INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)",
		userID, token, expiresAt,
	)
	if err != nil {
		return fmt.Errorf("error creating session: %w", err)
	}

	return nil
}

func (sr *SessionsRepository) DeleteSessionByToken(token string) error {
	_, err := sr.db.Exec("DELETE FROM sessions WHERE session_token = ?", token)
	return err
}

// Get the session by token:
func (sessionRepo *SessionsRepository) GetSessionByToken(token string) (int, error) {
	query := `SELECT user_id FROM sessions WHERE session_token = ?`
	var userId int
	err := sessionRepo.db.QueryRow(query, token).Scan(&userId)
	if err != nil {
		return 0, err
	}
	return userId, nil
}