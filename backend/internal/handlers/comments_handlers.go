package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"real_time_forum/internal/handlers/utils"
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
		utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{"message": "invalid method"})
		return
	}
	var comment models.Comment
	err := json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "Invalid request body"})
		return
	}
	session, err := r.Cookie("session_token")
	if err != nil || session == nil {
		utils.ResponseJSON(w, http.StatusUnauthorized, map[string]any{"message": "invalid token"})
		return
	}
	err = comHand.ComSer.MakeComments(&comment, session.Value)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "error createComment"})
		return
	}
	utils.ResponseJSON(w, http.StatusCreated, map[string]string{"message": "post added successfully"})
}

// handle showing comments:
func (comHand *CommentsHandler) ShowCommentsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{"message": "method not allowed"})
		return
	}
	queryParam := r.URL.Query()
	query := queryParam.Get("id")
	offsetStr := r.URL.Query().Get("offset")
	limitStr := r.URL.Query().Get("limit")

	id, err := strconv.Atoi(query)
	if err != nil {
		utils.ResponseJSON(w, http.StatusBadRequest, map[string]any{"message": "query not allowed"})
		return
	}
	// Default to 0 and 10 if not provided
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	comments, err := comHand.ComSer.ShowCommentsservice(id, offset, limit)
	if err != nil {
		utils.ResponseJSON(w, http.StatusInternalServerError, map[string]any{"message": "error getComment"})
		return
	}
	utils.ResponseJSON(w, http.StatusCreated, comments)
}
