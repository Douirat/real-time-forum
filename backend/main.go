package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"real_time_forum/database"
	"real_time_forum/internal/handlers"
	"real_time_forum/internal/repositories"
	"real_time_forum/internal/router"
	"real_time_forum/internal/services"
	"time"
)

var databaseConnection *sql.DB
var mainError error

func init() {
	databaseConnection, mainError = database.Connect()
	if mainError == nil {
		mainError = database.Migrate(databaseConnection)
	}
}

func main() {
	if mainError != nil {
		fmt.Printf("Error connecting to database: %v\n", mainError)
		return
	}
	defer databaseConnection.Close()
	fmt.Println("Connected successfully to database")

	// Initialize repositories
	usersRepository := repositories.NewUsersRepository(databaseConnection)
	sessionRepository := repositories.NewSessionsRepository(databaseConnection)

	// Initialize services
	usersServices := services.NewUsersServices(usersRepository)
	
	// Create session service with configuration
	sessionService := &services.SessionService{
		SessionRepo: sessionRepository,
		UserRepo:    usersRepository,
		TokenLength: 32,               // 32 bytes for token
		SessionLife: 24 * time.Hour,   // Sessions last 24 hours
	}

	// Initialize handlers
	usersHandlers := handlers.NewUsersHandlers(usersServices, sessionService)

	// Setup router and routes
	mainRouter := router.NewRouter()
	
	// User routes
	mainRouter.AddRoute("POST", "/add_user", usersHandlers.UsersRegistrationHandler)
	mainRouter.AddRoute("POST", "/login", usersHandlers.Login)

	fmt.Println("Routes registered:", mainRouter.Routes)
	fmt.Println("Listening on port: http://localhost:8080/")
	
	mainError = http.ListenAndServe(":8080", mainRouter)
	if mainError != nil {
		fmt.Printf("Error: %v\n", mainError)
		return
	}
}