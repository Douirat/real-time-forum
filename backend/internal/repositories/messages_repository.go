package repositories

import (
	"database/sql"
	"fmt"
	"real_time_forum/internal/models"
	"time"
)

// Create an interface to represent the repository:
type MessageRepositoryLayer interface {
	InsertMessage(m *models.Message) error
	GetChatHistory(client, guest int) ([]*models.Message, error)
	GetLastMessage(user1ID, user2ID int) (*models.Message, error)
	// MarkMessagesAsRead(senderID, receiverID int) error
	// GetUnreadMessageCount(userID int) (int, error)
	// GetUnreadMessages(userID int) ([]*models.Message, error)
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

// Get the chat history between the chosen user and the client:
func (mesRepo *MessageRepository) GetChatHistory(client, guest int) ([]*models.Message, error) {
	// 4. Fetch messages between the two users
	query := `
	SELECT ID, content, sender_id, receiver_id, is_read, created_at
	FROM private_messages
	WHERE (sender_id = ? AND receiver_id = ?)
	   OR (sender_id = ? AND receiver_id = ?)
	ORDER BY created_at ASC;
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
		if err := rows.Scan(&msg.Id, &msg.Content, &msg.SenderId, &msg.RecieverId, &msg.IsRead, &createdAtStr); err != nil {
			return nil, err
		}
		// Parse the timestamp
		if createdAt, parseErr := time.Parse("2006-01-02 15:04:05", createdAtStr); parseErr == nil {
			msg.CreatedAt = createdAt
		}
		messages = append(messages, msg)
	}
	fmt.Println(messages)
	return messages, nil
}

// Get the LastMessage :
func (mesRepo *MessageRepository) GetLastMessage(client, guest int) (*models.Message, error) {
	query := `
	SELECT ID, content, sender_id, receiver_id, is_read, created_at
	FROM private_messages
	WHERE (sender_id = ? AND receiver_id = ?)
	   OR (sender_id = ? AND receiver_id = ?)
	ORDER BY created_at DESC
	LIMIT 1;
	`
	row := mesRepo.db.QueryRow(query, client, guest, guest, client)

	msg := &models.Message{}
	var createdAtStr string

	err := row.Scan(&msg.Id, &msg.Content, &msg.SenderId, &msg.RecieverId, &msg.IsRead, &createdAtStr)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Parse created_at
	if createdAt, parseErr := time.Parse("2006-01-02 15:04:05", createdAtStr); parseErr == nil {
		msg.CreatedAt = createdAt
	}

	return msg, nil
}
