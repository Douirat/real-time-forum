
#!/bin/bash

# Create a test post with multiple categories
echo "Testing post creation with categories..."
curl -X POST \
  http://localhost:8080/add_post \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
  "title": "Introduction to Go Programming",
  "content": "Go is an open-source programming language developed by Google. It is statically typed and compiled.",
  "categories": [2, 4]
}'

echo -e "\n\nTesting get all posts..."
curl -X GET \
  http://localhost:8080/get_posts \
  -b cookies.txt

echo -e "\n\nTesting get all categories..."
curl -X GET \
  http://localhost:8080/get_categories \
  -b cookies.txt

# Make the script executable with:
# chmod +x test_post.sh