package repositories

import (
	"database/sql"
	"real_time_forum/internal/models"
)

// Create an interface to represent the repository:
type MessageRepositoryLayer interface {
	InsertMessage(m *models.Message) error
}

// Create a struct to implement the messages contract:
type MessageRepository struct {
	db *sql.DB
}

// Instantiate a new message object:
func NewMessageRepository(dataBase *sql.DB) *MessageRepository {
	return &MessageRepository{db: dataBase}
}

// insert a new message into database:
func (mes *MessageRepository) InsertMessage(message *models.Message) error {
	query := `INSERT INTO private_messages(content, sender_id, receiver_id, is_read, created_at) VALUES(?, ?, ?, ?, ?)`
	_, err := mes.db.Exec(query, message.Content, message.SenderId, message.RecieverId, message.IsRead, message.CreatedAt)
	return err
}
