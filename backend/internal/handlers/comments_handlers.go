package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"real_time_forum/internal/models"
	"real_time_forum/internal/services"
)

// Create a structure to represent the comments handler:
type CommentsHandler struct {
	ComSer services.CommentsServicesLayer
}

// instantiate a new comments handler:
func NewCommentsHandler(comServ *services.CommentsServices) *CommentsHandler {
	return &CommentsHandler{
		ComSer: comServ,
	}
}

// Create a a new comment handler:
func (comHand *CommentsHandler) MakeCommentsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "invalid method", http.StatusMethodNotAllowed)
		return
	}
	var comment models.Comment
	err := json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	// session, err := r.Cookie("session_token")
	// if err != nil || session == nil {
	// 	http.Redirect(w, r, "/login", http.StatusFound)
	// 	return
	// }
	fmt.Println("comment ===>", comment)
	err = comHand.ComSer.MakeComments(&comment, "")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(struct {
		Message string `json:"message"`
	}{
		Message: "comment created successfully",
	})
}
