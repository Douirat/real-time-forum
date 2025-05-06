package utils

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// Check valid gender:
func IsValidGender(gender string) bool {
	return gender == "Male" || gender == "Female"
}

// HashPassword takes a plain text password and returns a bcrypt hash
func HashPassword(password string) (string, error) {
	// Generate bcrypt hash from password with default cost
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("error hashing password: %w", err)
	}
	return string(hashedBytes), nil
}

// CheckPasswordHash compares a bcrypt hashed password with a plain-text password
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
