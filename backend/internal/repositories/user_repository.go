package repositories

import (
	"database/sql"
	"real_time_forum/internal/models"
)

// Create an interface to represent all the user repositoru functionalities:
type UsersRepositoryLayer interface {
	RegisterNewUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id int) (*models.User, error)
	GetUsersRepo() ([]*models.ChatUser, error)
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
	// Fixed SQL query missing quotes and fixing syntax
	query := "SELECT id, nick_name, age, gender, first_name, last_name, email, password FROM users WHERE id = ?"
	user := &models.User{}
	// Fixed Scan by using address-of fields
	err := userRepo.db.QueryRow(query, id).Scan(
		&user.Id, &user.NickName, &user.Age, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.Password,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Get all users:
func (userRepo *UsersRepository) GetUsersRepo() ([]*models.ChatUser, error) {
	query := `SELECT id, nick_name FROM users`
	rows, err := userRepo.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.ChatUser
	for rows.Next() {
		chatUser := &models.ChatUser{}
		err := rows.Scan(&chatUser.Id, &chatUser.NickName)
		if err != nil {
			return nil, err
		}
		users = append(users, chatUser)
	}
	return users, nil
}