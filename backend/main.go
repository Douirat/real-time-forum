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
		fmt.Println("Error connecting to database:", mainError)
		return
	}
	defer databaseConnection.Close()
	fmt.Println("✅ Connected successfully to database")

	// Repositories
	usersRepository := repositories.NewUsersRepository(databaseConnection)
	sessionRepository := repositories.NewSessionsRepository(databaseConnection)
	postsRepository := repositories.NewPostsRepository(databaseConnection)
	commentsRepository := repositories.NewCommentsRepository(databaseConnection)
	messageRepository := repositories.NewMessageRepository(databaseConnection)

	// Services
	usersServices := services.NewUsersServices(usersRepository)
	sessionService := services.NewSessionsServices(usersRepository, sessionRepository)
	postsServices := services.NewPostService(postsRepository, sessionRepository)
	commentsService := services.NewCommentsServices(commentsRepository, sessionRepository)
	webSocketService := services.NewWebSocketService(messageRepository, sessionRepository)
	messagesService := services.NewMessageService(messageRepository, sessionRepository)

	// Handlers
	usersHandlers := handlers.NewUsersHandlers(usersServices, sessionService)
	postsHandlers := handlers.NewPostsHandles(postsServices)
	commentsHandlers := handlers.NewCommentsHandler(commentsService)
	webSocketHandler := handlers.NewWebSocketHandler(webSocketService)
	messagesHandler := handlers.NewMessagesHandler(messagesService)

	// Router
	mainRouter := router.NewRouter(sessionService)

	// Routes
	mainRouter.AddRoute("GET", "/register", usersHandlers.UsersRegistrationHandler)
	mainRouter.AddRoute("POST", "/login", usersHandlers.UsersLoginHandler)
	mainRouter.AddRoute("POST", "/logout", usersHandlers.Logout)
	mainRouter.AddRoute("GET", "/get_users", usersHandlers.GetUsersHandler)
	mainRouter.AddRoute("GET", "/is_logged", usersHandlers.IsLogged)
	mainRouter.AddRoute("POST", "/add_post", postsHandlers.CreatePostsHandler)
	mainRouter.AddRoute("GET", "/get_posts", postsHandlers.GetAllPostsHandler)
	mainRouter.AddRoute("GET", "/get_categories", postsHandlers.GetAllCategoriesHandler)
	mainRouter.AddRoute("POST", "/commenting", commentsHandlers.MakeCommentsHandler)
	mainRouter.AddRoute("GET", "/get_comments", commentsHandlers.ShowCommentsHandler)
	mainRouter.AddRoute("GET", "/get_chat", messagesHandler.GetChatHistoryHandler)
	mainRouter.AddRoute("GET", "/ws", webSocketHandler.WebsocketHandler)

	// Start Server
	fmt.Println("🚀 Server is running at: http://localhost:8080/")
	mainError = http.ListenAndServe(":8080", mainRouter)
	if mainError != nil {
		fmt.Println("Server error:", mainError)
	}
}
