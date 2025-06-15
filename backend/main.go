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
		return
	}
	defer databaseConnection.Close()
	fmt.Println("Connected successfully to database")

	// craete Chat Broker :
	chatBroker :=services.NewChatBroker()
	go chatBroker.RunChatBroker()

	// Initialize repositories:
	usersRepository := repositories.NewUsersRepository(databaseConnection)
	sessionRepository := repositories.NewSessionsRepository(databaseConnection)
	postsRepository := repositories.NewPostsRepository(databaseConnection)
	commentsRepository := repositories.NewCommentsRepository(databaseConnection)
	messageRepository := repositories.NewMessageRepository(databaseConnection)

	// Initialize services:
	usersServices := services.NewUsersServices(usersRepository)
	sessionService := services.NewSessionsServices(usersRepository, sessionRepository)
	postsServices := services.NewPostService(postsRepository, sessionRepository)
	commentsService := services.NewCommentsServices(commentsRepository, sessionRepository)
	webSocketService := services.NewWebsocketSevice(chatBroker,messageRepository,usersRepository, sessionRepository)
	messagesService := services.NewMessageService(messageRepository, sessionRepository)

	// Initialize handlers:
	usersHandlers := handlers.NewUsersHandlers(chatBroker, usersServices, sessionService)
	postsHandlers := handlers.NewPostsHandles(postsServices)
	commentsHandlers := handlers.NewCommentsHandler(commentsService)
	webSocketHandler := handlers.NewWebSocketHandler(webSocketService, sessionService)
	messagesHandler := handlers.NewMessagesHandler(messagesService)
	// Setup router and routes:
	mainRouter := router.NewRouter(sessionService)



	mainRouter.AddRoute("GET", "/get_chat", messagesHandler.GetChatHistoryHandler)
	mainRouter.AddRoute("POST", "/register", usersHandlers.UsersRegistrationHandler)
	mainRouter.AddRoute("POST", "/login", usersHandlers.UsersLoginHandler)
	mainRouter.AddRoute("POST", "/logout", usersHandlers.Logout)
	mainRouter.AddRoute("GET", "/get_users", usersHandlers.GetUsersHandler)
	mainRouter.AddRoute("GET", "/logged_user", usersHandlers.IsLogged)
	mainRouter.AddRoute("POST", "/add_post", postsHandlers.CreatePostsHandler)
	mainRouter.AddRoute("GET", "/get_posts", postsHandlers.GetAllPostsHandler)
	mainRouter.AddRoute("GET", "/get_categories", postsHandlers.GetAllCategoriesHandler)
	mainRouter.AddRoute("POST", "/commenting", commentsHandlers.MakeCommentsHandler)
	mainRouter.AddRoute("GET", "/get_comments", commentsHandlers.ShowCommentsHandler)
	mainRouter.AddRoute("GET", "/ws", webSocketHandler.SocketHandler)
	mainRouter.AddRoute("GET", "/ws_users", webSocketHandler.GetUsers)
	
	

	// fmt.Println("Routes registered:", mainRouter.Routes)
	fmt.Println("Listening on port: http://localhost:8080/")

	mainError = http.ListenAndServe(":8080", mainRouter)
	if mainError != nil {
		return
	}
}