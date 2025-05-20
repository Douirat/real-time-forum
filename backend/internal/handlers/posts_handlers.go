package handlers

import (
	"encoding/json"
	"net/http"

	"real_time_forum/internal/models"
	"real_time_forum/internal/services"
	"real_time_forum/internal/services/utils"
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
		http.Error(w, "invalid method", http.StatusMethodNotAllowed)
		return
	}
	var post models.PostUser

	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	session, err := r.Cookie("session_token")

	if err != nil || session == nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{
			"message": "invalid token",
		})
		return
	}

	err = postHand.postsServ.CreatePost(&post, session.Value)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.ResponseJSON(w, http.StatusCreated, map[string]string{"message": "post added successfully"})
}

// Get all posts handler:
func (postHand *PostsHandlers) GetAllPostsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	posts, err := postHand.postsServ.GetAllPostsService()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(posts)
}

// Get all posts handler:
func (postHand *PostsHandlers) GetAllCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	categ, err := postHand.postsServ.GetAllCategoriesService()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(categ)
}
