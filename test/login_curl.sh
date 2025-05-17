#!/bin/bash

# Do login request
response=$(curl -s -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "idmossab@gmail.com",
    "password": "idmossab@gmail.com" 
}')

# Show raw response
echo "Login response: $response"

# Extract token (improved extraction to handle different JSON formats)
token=$(echo "$response" | jq -r '.session_token // .token // .access_token // ""')

# Check if token is valid
if [ -n "$token" ] && [ "$token" != "null" ]; then
  echo "$token" > session_token.txt
  echo "Token saved to session_token.txt"
else
  echo "Error: Could not extract session token."
  # For debugging, show what fields are available in the response
  echo "Available JSON fields:"
  echo "$response" | jq 'keys'
fi