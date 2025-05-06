package repositories

import (
	"database/sql"
	"real_time_forum/internal/models"
)

// Create an interface to represent all the user repositoru functionalities:
type UsersRepositoryLayer interface {
	RegisterNewUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
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
	query := `SELECT *FROM users WHERE email = ?`
	user := &models.User{}
	err := userRepo.db.QueryRow(query, email).Scan(
		user.Id, user.NickName, user.Age, user.Gender, user.FirstName, user.LastName, user.Password,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// getid
func (userRepo *UsersRepository) GetUserByID(id int) (*models.User, error) {
	query := `SELECT id, nick_name, age, gender, first_name, last_name, email, password 
			  FROM users WHERE id = ?`
	user := &models.User{}
	err := userRepo.db.QueryRow(query, id).Scan(
		user.Id, user.NickName, user.Age, user.Gender, user.FirstName, user.LastName, user.Password,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}
