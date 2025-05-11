package database

import (
	"database/sql"
	"fmt"
)

const schema = `
    -- create users table:
    CREATE TABLE IF NOT EXISTS users(
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    nick_name TEXT UNIQUE NOT NULL,
    age INTEGER CHECK(age > 0 AND age < 100),
    gender TEXT NOT NULL, 
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL);
    
    -- create sessions table :
    CREATE TABLE IF NOT EXISTS sessions(
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(ID) ON DELETE CASCADE);

    -- create posts table :
    CREATE TABLE IF NOT EXISTS posts (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL, 
    -- image_path TEXT,
    created_at TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(ID) ON DELETE CASCADE);

    -- create categories table :
    CREATE TABLE IF NOT EXISTS categories (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL);

    -- Post-Category relationship
    CREATE TABLE IF NOT EXISTS post_categories (
    post_id INTEGER,
    category_id INTEGER,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(ID) ON DELETE CASCADE, 
    FOREIGN KEY (category_id) REFERENCES categories(ID) ON DELETE CASCADE);

    -- create private Messages
    CREATE TABLE IF NOT EXISTS private_messages (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(ID) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(ID) ON DELETE CASCADE);
    `

func Migrate(db *sql.DB) error {
	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("error migrating: %v\n", err)
	}
	return nil
}
