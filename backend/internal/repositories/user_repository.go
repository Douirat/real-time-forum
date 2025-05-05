package repositories

import (
	"database/sql"
	"real_time_forum/internal/models"
)

// Create an interface to represent all the user repositoru functionalities:
type usersRepositoryLayer interface {
	RegisterNewUser(user *models.User) error
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
