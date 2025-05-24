package repositories

import (
	"database/sql"
	"real_time_forum/internal/models"
	"time"
)

// Message repository interface with read status functionality
type MessageRepositoryLayer interface {
	InsertMessage(m *models.Message) error
	GetChatHistory(client, guest int) ([]*models.Message, error)
	MarkMessagesAsRead(senderID, receiverID int) error
	GetUnreadMessageCount(userID int) (int, error)
	GetUnreadMessages(userID int) ([]*models.Message, error)
}

// Message repository implementation
type MessageRepository struct {
	db *sql.DB
}

// Create new message repository
func NewMessageRepository(dataBase *sql.DB) *MessageRepository {
	return &MessageRepository{db: dataBase}
}

// Insert a new message into database
func (mes *MessageRepository) InsertMessage(message *models.Message) error {
	query := `INSERT INTO private_messages(content, sender_id, receiver_id, is_read, created_at) 
			  VALUES(?, ?, ?, ?, ?)`
	
	_,err := mes.db.Exec(query, 
		message.Content, 
		message.SenderId, 
		message.RecieverId, 
		message.IsRead, 
		message.CreatedAt,
	)
	
	return err
}

// Get chat history between two users
func (mesRepo *MessageRepository) GetChatHistory(client, guest int) ([]*models.Message, error) {
	query := `
	SELECT id, content, sender_id, receiver_id, is_read, created_at 
	FROM private_messages 
	WHERE (sender_id = ? AND receiver_id = ?) 
	   OR (sender_id = ? AND receiver_id = ?) 
	ORDER BY created_at ASC
	`
	
	rows, err := mesRepo.db.Query(query, client, guest, guest, client)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*models.Message
	for rows.Next() {
		msg := &models.Message{}
		var createdAtStr string
		
		err := rows.Scan(
			&msg.Id, 
			&msg.Content, 
			&msg.SenderId, 
			&msg.RecieverId, 
			&msg.IsRead, 
			&createdAtStr,
		)
		if err != nil {
			return nil, err
		}

		// Parse the timestamp
		if createdAt, parseErr := time.Parse("2006-01-02 15:04:05", createdAtStr); parseErr == nil {
			msg.CreatedAt = createdAt
		}

		messages = append(messages, msg)
	}

	return messages, nil
}

// Mark all messages from a specific sender to receiver as read
func (mesRepo *MessageRepository) MarkMessagesAsRead(senderID, receiverID int) error {
	query := `UPDATE private_messages 
			  SET is_read = 1 
			  WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`
	
	_, err := mesRepo.db.Exec(query, senderID, receiverID)
	return err
}

// Get count of unread messages for a user
func (mesRepo *MessageRepository) GetUnreadMessageCount(userID int) (int, error) {
	query := `SELECT COUNT(*) FROM private_messages 
			  WHERE receiver_id = ? AND is_read = 0`
	
	var count int
	err := mesRepo.db.QueryRow(query, userID).Scan(&count)
	return count, err
}

// Get all unread messages for a user
func (mesRepo *MessageRepository) GetUnreadMessages(userID int) ([]*models.Message, error) {
	query := `
	SELECT pm.id, pm.content, pm.sender_id, pm.receiver_id, pm.is_read, pm.created_at,
		   u.nick_name as sender_name
	FROM private_messages pm
	JOIN users u ON pm.sender_id = u.id
	WHERE pm.receiver_id = ? AND pm.is_read = 0
	ORDER BY pm.created_at ASC
	`
	
	rows, err := mesRepo.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*models.Message
	for rows.Next() {
		msg := &models.Message{}
		var createdAtStr string
		var senderName string
		
		err := rows.Scan(
			&msg.Id, 
			&msg.Content, 
			&msg.SenderId, 
			&msg.RecieverId, 
			&msg.IsRead, 
			&createdAtStr,
			&senderName,
		)
		if err != nil {
			return nil, err
		}

		// Parse timestamp
		if createdAt, parseErr := time.Parse("2006-01-02 15:04:05", createdAtStr); parseErr == nil {
			msg.CreatedAt = createdAt
		}

		messages = append(messages, msg)
	}

	return messages, nil
}