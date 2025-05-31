package app

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

func InitializeApp() (http.Handler, *sql.DB, error) {
	// Connect to DB
	db, err := database.Connect()
	if err != nil {
		return nil, nil, err
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		return nil, nil, err
	}

	fmt.Println("Connected successfully to database")

	// Repositories
	usersRepo := repositories.NewUsersRepository(db)
	sessionsRepo := repositories.NewSessionsRepository(db)
	postsRepo := repositories.NewPostsRepository(db)
	commentsRepo := repositories.NewCommentsRepository(db)
	messagesRepo := repositories.NewMessageRepository(db)

	// Services
	usersService := services.NewUsersServices(usersRepo)
	sessionsService := services.NewSessionsServices(usersRepo, sessionsRepo)
	postsService := services.NewPostService(postsRepo, sessionsRepo)
	commentsService := services.NewCommentsServices(commentsRepo, sessionsRepo)
	wsService := services.NewWebSocketService(messagesRepo, sessionsRepo, usersRepo)
	msgService := services.NewMessageService(messagesRepo, sessionsRepo)

	// Handlers
	usersHandler := handlers.NewUsersHandlers(usersService, sessionsService)
	postsHandler := handlers.NewPostsHandles(postsService)
	commentsHandler := handlers.NewCommentsHandler(commentsService)
	wsHandler := handlers.NewWebSocketHandler(wsService)
	msgHandler := handlers.NewMessagesHandler(msgService)

	// Router
	r := router.NewRouter(sessionsService)

	// Routes
	r.AddRoute("POST", "/register", usersHandler.UsersRegistrationHandler)
	r.AddRoute("POST", "/login", usersHandler.UsersLoginHandler)
	r.AddRoute("POST", "/logout", usersHandler.Logout)
	r.AddRoute("GET", "/get_users", usersHandler.GetUsersHandler)
	r.AddRoute("GET", "/is_logged", usersHandler.IsLogged)
	r.AddRoute("POST", "/add_post", postsHandler.CreatePostsHandler)
	r.AddRoute("GET", "/get_posts", postsHandler.GetAllPostsHandler)
	r.AddRoute("GET", "/get_categories", postsHandler.GetAllCategoriesHandler)
	r.AddRoute("POST", "/commenting", commentsHandler.MakeCommentsHandler)
	r.AddRoute("GET", "/get_comments", commentsHandler.ShowCommentsHandler)
	r.AddRoute("GET", "/get_chat", msgHandler.GetChatHistoryHandler)
	r.AddRoute("GET", "/ws", wsHandler.WebsocketHandler)
	r.AddRoute("GET", "/ws_users", wsHandler.GetUsers)

	return r, db, nil
}
