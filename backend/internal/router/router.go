package router

import (
	"net/http"
	"strings"

	"real_time_forum/internal/services"
)

type Router struct {
	Routes        map[string]http.HandlerFunc
	usersSessions services.SessionsServicesLayer
}

func NewRouter(session *services.SessionService) *Router {
	return &Router{
		Routes:        make(map[string]http.HandlerFunc),
		usersSessions: session,
	}
}

func (router *Router) AddRoute(method string, path string, handler http.HandlerFunc) {
	route := strings.ToLower(method + ":" + path)
	router.Routes[route] = handler
}

func (router *Router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	frontEndPaths := map[string]bool{
		"/register": true,
		"/login":    true,
	}

	origin := r.Header.Get("Origin")
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if frontEndPaths[r.URL.Path] && r.Method == "GET" {
		http.ServeFile(w, r, "../frontend/index.html")
		return
	}

	// check the session to allow only logged in user to visit the home page:
	// Fixed session check code - check if cookie exists before accessing its value
	isValid := false
	session, err := r.Cookie("session_token")
	if err == nil && session != nil {
		isValid = router.usersSessions.IsValidSession(session.Value)
	}
	if r.Method == "GET" && (r.URL.Path == "/" || r.URL.Path == "/index.html") {
		if !isValid {
			http.Redirect(w, r, "/login", http.StatusFound) // 302
			return
		}
		http.ServeFile(w, r, "../frontend/index.html")
		return
	}

	if r.Method == "GET" && strings.HasPrefix(r.URL.Path, "/static/") || r.Method == "GET" && strings.HasPrefix(r.URL.Path, "/styles/") {
		http.ServeFile(w, r, "../frontend"+r.URL.Path)
		return
	}

	route := strings.ToLower(r.Method + ":" + r.URL.Path)
	if handler, ok := router.Routes[route]; ok {
		handler(w, r)
		return
	}
	http.NotFound(w, r)
}
