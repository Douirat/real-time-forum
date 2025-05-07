#!/bin/bash

# Test user registration with curl
curl -X POST \
  http://localhost:8080/add_user \
  -H 'Content-Type: application/json' \
  -d '{
    "age": 25,
    "gender": "male",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "password123"
}'

# Make the script executable with:
# chmod +x register_curl.sh