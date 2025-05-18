#!/bin/bash

curl -X POST \
  http://localhost:8080/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "alae",
    "last_name": "alae",
    "age": 12/12/1999,
    "gender": "male",
    "email": "idmossab@gmail.com,
    "password": "idmossab@gmail.com"
  }'

# Make the script executable with:
# chmod +x register_curl.sh

