#!/bin/bash

curl -X POST \
  http://localhost:8080/add_post \
  -H "Content-Type: application/json" \
  -d '{
  "id": 1,
  "title": "Introduction to Go",
  "content": "Go is an open-source programming language developed by Google.",
  "created_at": "2025-05-10 15:45:00",
  "user_id": 42
}
'

# Make the script executable with:
# chmod +x register_curl.sh

