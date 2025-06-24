#!/bin/sh

curl -X GET http://localhost:8080/get_profile \
  -H "Content-Type: application/json" \
  -d '{"offset": 0, "limit": 10}'
