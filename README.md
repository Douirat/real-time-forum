# real-time-forum

> A full-stack single-page forum with real-time private messaging, built from scratch using Go, vanilla JavaScript, and SQLite.

---

## What Is This Project?

**real-time-forum** is an upgraded version of the classic forum — same idea, but with live private messaging, WebSocket-powered real-time updates, and a fully dynamic single-page application architecture. No page reloads, no frontend frameworks, just raw Go and vanilla JS.

---

## Features

### Authentication
- Register with: nickname, age, gender, first name, last name, email, and password
- Login using **nickname or email** + password
- Logout from any page
- Unauthenticated users only see the register/login page

### Posts & Comments
- Create posts with categories
- Comment on posts
- Feed-style post display — comments load only when a post is clicked

### Private Messaging (Real-Time)
- Sidebar showing all users with **online/offline status**, visible at all times
- Users sorted by **last message sent** (alphabetically if no messages yet)
- Click a user to open the chat and load the last **10 messages**
- Scroll up to load **10 more** (throttled/debounced — no spam)
- Each message displays the **sender's name** and **timestamp**
- Messages delivered **instantly** via WebSockets — no refresh needed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | SQLite |
| Backend | Go (goroutines, channels, WebSockets) |
| Frontend | Vanilla JavaScript (SPA, DOM manipulation) |
| Markup | HTML (single file) |
| Styling | CSS |

### Allowed Packages
- All standard Go packages
- `gorilla/websocket`
- `mattn/go-sqlite3`
- `golang.org/x/crypto/bcrypt`
- `google/uuid`

> No frontend libraries or frameworks (React, Angular, Vue, etc.)

---

## Architecture

The entire UI lives in **one HTML file**. Every view — login, feed, chat — is rendered and swapped dynamically by JavaScript. This is a **Single Page Application (SPA)** pattern implemented without any framework.

```
real-time-forum/
├── main.go                 # Entry point
├── go.mod
├── database/
│   └── db.go               # SQLite setup & queries
├── handlers/
│   ├── auth.go             # Register, login, logout
│   ├── posts.go            # Post & comment handlers
│   └── messages.go         # Private message handlers
├── websocket/
│   └── hub.go              # WebSocket hub, goroutines, channels
├── static/
│   ├── index.html          # Single HTML file
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js          # Router / page manager
│       ├── auth.js
│       ├── posts.js
│       └── chat.js         # WebSocket client, throttle/debounce
```

---

## WebSocket Flow

```
Client (JS)  ──── ws:// ────▶  Go Hub
                               │
                    ┌──────────┴──────────┐
                 User A                User B
              (goroutine)           (goroutine)
                               │
                    message broadcast / direct route
```

- Each connected user gets a dedicated goroutine
- The hub manages all active connections via Go channels
- Messages are routed directly between users in real time

---

## Key Concepts Practiced

- HTTP, sessions & cookies
- Go routines & channels
- WebSockets (server + client side)
- SQLite & SQL queries
- DOM manipulation without frameworks
- Throttle & Debounce for scroll events
- SPA routing in vanilla JS

---

## Example Usage

```
# Run the server
go run main.go

# Open in browser
http://localhost:8080
```

---

*Project by Bennacer Douirat & Mossab Idbenkellal — Zone01 Oujda*
