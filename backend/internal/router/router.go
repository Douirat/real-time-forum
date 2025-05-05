package router

import (
	"net/http"
)

type Router struct {
	router *http.ServeMux
}

func (r *Router) NewRouter(rt *http.ServeMux) *Router {
	inst := http.NewServeMux()
	return &Router{router: inst}
}


