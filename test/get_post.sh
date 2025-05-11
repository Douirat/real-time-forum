#!/bin/bash

# URL de tu API
URL="http://localhost:8080/get_posts"

# Realizar la petición GET y obtener tanto cuerpo como código de estado
response=$(curl -s -w "\n%{http_code}" -X GET "$URL")

# Separar cuerpo de la respuesta del código HTTP
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

# Mostrar resultados
echo "Código de respuesta HTTP: $status"
echo "Cuerpo de respuesta JSON:"
echo "$body"

# Verificar que el código de estado sea 200 OK
if [ "$status" -eq 200 ]; then
  echo "✅ Test PASÓ: Respuesta con código 200 OK"

  # Validar que el JSON contiene algún dato esperado (por ejemplo, una lista de posts)
  if echo "$body" | grep -q '"post 1"'; then
    echo "✅ Test PASÓ: JSON contiene el post esperado"
  else
    echo "❌ Test FALLÓ: JSON no contiene el post esperado"
    exit 1
  fi

else
  echo "❌ Test FALLÓ: Código de respuesta $status"
  exit 1
fi
