package services

import (
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
)

// Create an interface to describe the functionalities of the user services:
type UsersServicesLayer interface {
	UserRegestration(user *models.User) error
}

// Create structure to implement the services innterfase:
type UsersServices struct {
	userRepository repositories.UsersRepositoryLayer
}

// Instantiate the user_service structure:
func NewUsersServices(userRepo repositories.UsersRepositoryLayer) *UsersServices {
	return &UsersServices{userRepository: userRepo}
}

// Register q new user service:
func (userServ *UsersServices) UserRegestration(user *models.User) error {
	user.NickName = string(user.LastName[0]) + user.FirstName
	return userServ.userRepository.RegisterNewUser(user)
}
