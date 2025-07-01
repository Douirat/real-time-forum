package utils

import (
	"net/http"
	"strconv"
)

func ParseLimitOffset(r *http.Request) (offset, limit int) {
	offsetStr := r.URL.Query().Get("offset")
	limitStr := r.URL.Query().Get("limit")

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	limit, err = strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	return offset, limit
}