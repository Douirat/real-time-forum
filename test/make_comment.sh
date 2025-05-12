#!/bin/bash
curl -X POST \
  http://localhost:8080/commenting \
  -H "Content-Type: application/json" \
  -d '{
  "id": 1,
  "content": "Introduction to Go",
  "author_id": 1,
  "created_at": "2025-05-10 15:45:00",
  "created_at": "-"
}
'