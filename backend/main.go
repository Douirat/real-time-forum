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
		fmt.Println("Error connecting to database: %w", mainError)
		return
	}
	defer databaseConnection.Close()
	fmt.Println("connected successfully")

	usersRepostories := repositories.NewUsersRepository(databaseConnection)
	usersServices := services.NewUsersServices(usersRepostories)
	usersHandlers := handlers.NewUsersHandlers(usersServices)



	mainRouter := router.NewRouter()
	mainRouter.AddRoute("POST", "/add_user", usersHandlers.UsersRegistrationHandler)
	mainRouter.AddRoute("POST", "/login", usersHandlers.Login)
	fmt.Println(mainRouter.Routes)
	fmt.Println("listenning on port: http://localhost:8080/")
	mainError = http.ListenAndServe(":8080", mainRouter)
	if mainError != nil {
		fmt.Printf("Error: %v\n", mainError)
		return
	}
}