#!/bin/sh
# Este script é executado pelo Nginx no momento de inicialização do contêiner.
# Ele busca o placeholder __VITE_API_URL_PLACEHOLDER__ nos arquivos estáticos
# e os substitui pela variável VITE_API_URL ou um fallback.

API_URL=${VITE_API_URL:-"http://localhost:8080/api"}

echo "Configurando Frontend..."
echo "Substituindo __VITE_API_URL_PLACEHOLDER__ por $API_URL nos arquivos Javascript gerados."

find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__VITE_API_URL_PLACEHOLDER__|$API_URL|g" {} +

echo "Variáveis injetadas com sucesso."
