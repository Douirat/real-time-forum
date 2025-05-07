#!/bin/bash

curl -X POST \
  http://localhost:8080/add_user \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "alae",
    "last_name": "alae",
    "age": 22,
    "gender": "male",
    "email": "alae@example.com",
    "password": "strongpassword123"
  }'

# Make the script executable with:
# chmod +x register_curl.sh