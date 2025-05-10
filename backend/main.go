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
)

var (
	databaseConnection *sql.DB
	mainError          error
)

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

	// Initialize repositories:
	usersRepository := repositories.NewUsersRepository(databaseConnection)
	sessionRepository := repositories.NewSessionsRepository(databaseConnection)

	// Initialize services:
	usersServices := services.NewUsersServices(usersRepository)
	sessionService := services.NewSessionsServices(usersRepository, sessionRepository)

	// Initialize handlers:
	usersHandlers := handlers.NewUsersHandlers(usersServices, sessionService)

	// Setup router and routes:
	mainRouter := router.NewRouter(sessionService)

	// User routes:
	mainRouter.AddRoute("POST", "/register", usersHandlers.UsersRegistrationHandler)
	mainRouter.AddRoute("POST", "/login", usersHandlers.UsersLoginHandler)
	mainRouter.AddRoute("POST", "/logout", usersHandlers.Logout)

	fmt.Println("Routes registered:", mainRouter.Routes)
	fmt.Println("Listening on port: http://localhost:8080/login")

	mainError = http.ListenAndServe(":8080", mainRouter)
	if mainError != nil {
		fmt.Printf("Error: %v\n", mainError)
		return
	}
}
