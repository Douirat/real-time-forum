package router

import (
	"fmt"
	"net/http"
	"strings"
)

type Router struct {
	Routes map[string]http.HandlerFunc
}

func NewRouter() *Router {
	return &Router{
		Routes: make(map[string]http.HandlerFunc),
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
	fmt.Println("------------> ", origin)
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

	if r.Method == "GET" && (r.URL.Path == "/" || r.URL.Path == "/index.html") {
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
