package main

import (
	"fmt"
	"log"
	"net/http"
	"real_time_forum/database"
	"real_time_forum/internal/handlers"
	"real_time_forum/internal/repositories"
	"real_time_forum/internal/services"
	"real_time_forum/internal/router"
)

func main() {
	// Connect to database
	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err = database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize repositories
	userRepo := repositories.NewUsersRepository(db)

	// Initialize services
	userService := services.NewUsersServices(userRepo)

	// Initialize handlers
	userHandler := handlers.NewUsersService(userService)

	// Initialize router
	r := router.NewRouter(userHandler)

	// Start server
	port := ":8080"
	fmt.Printf("Server starting on port %s...\n", port)
	if err := http.ListenAndServe(port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}