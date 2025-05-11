package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"real_time_forum/internal/models"
	"real_time_forum/internal/services"
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
	if r.Method == "POST" {
		var post models.Post
		err := json.NewDecoder(r.Body).Decode(&post)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		fmt.Println(post)
		session, Err := r.Cookie("session_token")
		if Err != nil && session != nil{
			err = postHand.postsServ.CreatePost(&post, session.Value)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]string{"message": "post added successfully"})
			return
		} else {
			http.Redirect(w, r, "/login", http.StatusFound) // 302
			return
		}

	}
	http.Error(w, "invalid method", http.StatusMethodNotAllowed)
}
