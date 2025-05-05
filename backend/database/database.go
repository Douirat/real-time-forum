package database

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)

// Connect to my database:
func Connect() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "/database/real_time_forum.db")
	if err != nil {
		return nil, err
	}

	// Test the connection
	// if err = db.Ping(); err != nil {
	// 	return nil, err
	// }

	return db, nil
}
