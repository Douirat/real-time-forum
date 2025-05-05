package services

import (
	"real_time_forum/internal/models"
	"real_time_forum/internal/repositories"
)

type UsersServicesLayer interface {
	UserRegestration(user *models.User) error
}

type UsersServices struct {
	userRepository repositories.UsersRepositoryLayer
}

func NewUsersServices(userRepo repositories.UsersRepositoryLayer) *UsersServices {
	return &UsersServices{userRepository: userRepo}
}

func (userServ *UsersServices) UserRegestration(user *models.User) error {
	return userServ.userRepository.RegisterNewUser(user)
}
