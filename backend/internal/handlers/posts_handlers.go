package handlers

import (
	"encoding/json"
	"net/http"

	"real_time_forum/internal/models"
	"real_time_forum/internal/services"
	"real_time_forum/internal/handlers/utils"
)

// Create a struct to represent the user
type PostsHandlers struct {
	postsServ services.PostsServiceLayer
}

// Instantiate a new post handler:
func NewPostsHandles(postSer *services.PostsService) *PostsHandlers {
	return &PostsHandlers{
		postsServ: postSer,
	}
}

// Create a new post handler:
func (postHand *PostsHandlers) CreatePostsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{"message": "invalid method"})
		return
	}
	var post models.PostUser

	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "Invalid request body"})
		return
	}

	session, err := r.Cookie("session_token")

	if err != nil || session == nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "invalid token"})
		return
	}

	err = postHand.postsServ.CreatePost(&post, session.Value)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "error createPost"})
		return
	}

	utils.ResponseJSON(w, http.StatusCreated, map[string]string{"message": "post added successfully"})
}

// Get all posts handler:
func (postHand *PostsHandlers) GetAllPostsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{"message": "method not allowed"})
		return
	}
	posts, err := postHand.postsServ.GetAllPostsService()
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "error getPosts"})
		return
	}
	utils.ResponseJSON(w, http.StatusCreated, posts)
}

// Get all posts handler:
func (postHand *PostsHandlers) GetAllCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{"message": "method not allowed"})
		return
	}
	categ, err := postHand.postsServ.GetAllCategoriesService()
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "error getCategories"})
		return
	}
	utils.ResponseJSON(w, http.StatusCreated, categ)
}