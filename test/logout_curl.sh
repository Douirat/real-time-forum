#!/bin/bash

# Check if session_token.txt exists
if [ ! -f session_token.txt ]; then
  echo "Error: session_token.txt not found."
  exit 1
fi

# Read token from file and remove any whitespace
TOKEN=$(cat session_token.txt | tr -d '[:space:]')

# Validate token
if [ -z "$TOKEN" ]; then
  echo "Error: Token is empty in session_token.txt"
  exit 1
fi

echo "Using token: $TOKEN"

# Do logout request
response=$(curl -s -X POST http://localhost:8080/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Logout response: $response"

# Check if logout was successful (this depends on your API's response format)
# Assuming a successful response contains "success" or status code
if echo "$response" | grep -q "success\|true"; then
  echo "Logout successful, removing session file"
  rm session_token.txt
else
  echo "Note: Could not confirm successful logout. Check response for details."
fi