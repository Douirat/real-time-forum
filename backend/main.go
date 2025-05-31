package main

import (
	"fmt"
	"net/http"
	"real_time_forum/internal/app"
)

func main() {
	handler, db, err := app.InitializeApp()
	if err != nil {
		fmt.Println("Failed to start app:", err)
		return
	}
	defer db.Close()

	fmt.Println("Listening on http://localhost:8080/")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		fmt.Println("Server failed:", err)
	}
}
