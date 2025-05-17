#!/bin/bash

curl -X POST \
  http://localhost:8080/add_post \
  -H "Content-Type: application/json" \
  -d '{
  "title": "Introduction to Go",
  "content": "Go is an open-source programming language developed by Google.",
  "user_id": 2
}
'

# Make the script executable with:
# chmod +x register_curl.sh

