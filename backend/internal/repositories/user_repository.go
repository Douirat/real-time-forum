package repositories

import (
	"database/sql"
	"fmt"

	"real_time_forum/internal/models"
)

// Create an interface to represent all the user repositoru functionalities:
type UsersRepositoryLayer interface {
	RegisterNewUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id int) (*models.User, error)
	GetSortedUsersForChat(myID, offset, limit int) ([]*models.ChatUser, error)
}

// Create a structure to represent to implemente the contract with the repo interface:
type UsersRepository struct {
	db *sql.DB
}

// Create a new instance from the user crepository structure:
func NewUsersRepository(database *sql.DB) *UsersRepository {
	userRepo := new(UsersRepository)
	userRepo.db = database
	// return &UsersRepository{db: database}
	return userRepo
}

// Create a function to register a new user:
func (userRepo *UsersRepository) RegisterNewUser(user *models.User) error {
	query := "INSERT INTO users (nick_name, age, gender, first_name, last_name, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)"
	_, err := userRepo.db.Exec(query, user.NickName, user.Age, user.Gender, user.FirstName, user.LastName, user.Email, user.Password)
	if err != nil {
		return err
	}
	return nil
}

// get userbyemail
func (userRepo *UsersRepository) GetUserByEmail(email string) (*models.User, error) {
	// Fixed SQL query missing quotes
	query := "SELECT * FROM users WHERE email = ?"
	user := &models.User{}
	// Fixed Scan by using address-of fields
	err := userRepo.db.QueryRow(query, email).Scan(
		&user.Id, &user.NickName, &user.Age, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.Password,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// get user bu id:
func (userRepo *UsersRepository) GetUserByID(id int) (*models.User, error) {
	// Fixed SQL query missing quotes and fixing syntax:
	query := "SELECT id, nick_name, age, gender, first_name, last_name, email, password FROM users WHERE id = ?"
	user := &models.User{}
	// Fixed Scan by using address-of fields:
	err := userRepo.db.QueryRow(query, id).Scan(
		&user.Id, &user.NickName, &user.Age, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.Password,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Get all users:
func (userRepo *UsersRepository) GetSortedUsersForChat(myID, offset, limit int) ([]*models.ChatUser, error) {
	query := `
    SELECT id, nick_name
    FROM (
        -- Users who have chatted with me
        SELECT 
            u.id, u.nick_name, MAX(pm.created_at) AS last_message_time
        FROM 
            users u
        JOIN 
            private_messages pm
            ON (u.id = pm.sender_id AND pm.receiver_id = ?) OR
               (u.id = pm.receiver_id AND pm.sender_id = ?)
        WHERE 
            u.id != ?
        GROUP BY u.id

        UNION ALL

        -- Users who have NOT chatted with me
        SELECT 
            u.id, u.nick_name, NULL as last_message_time
        FROM 
            users u
        WHERE 
            u.id != ? AND
            u.id NOT IN (
                SELECT 
                    CASE 
                        WHEN pm.sender_id = ? THEN pm.receiver_id
                        ELSE pm.sender_id
                    END
                FROM private_messages pm
                WHERE pm.sender_id = ? OR pm.receiver_id = ?
            )
    )
    ORDER BY 
        last_message_time IS NULL,       
        last_message_time DESC,        
        LOWER(nick_name) ASC           
    LIMIT ? OFFSET ?;
    `

	rows, err := userRepo.db.Query(
		query,
		myID, myID, myID,
		myID,           
		myID, myID, myID,
		limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("query error: %v", err)
	}
	defer rows.Close()

	var users []*models.ChatUser
	for rows.Next() {
		chatUser := &models.ChatUser{}
		if err := rows.Scan(&chatUser.Id, &chatUser.NickName); err != nil {
			return nil, err
		}

		// You can later determine IsOnline via a map/session tracker
		chatUser.IsOnline = false 
		users = append(users, chatUser)
	}

	return users, nil
}
