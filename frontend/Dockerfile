# Stage 1: Build da aplicação React
FROM node:18-alpine AS builder
WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm ci

# Copia o código da aplicação
COPY . .

# Durante o build, injetamos uma string placeholder que será substituída no momento da execução
ENV VITE_API_URL=__VITE_API_URL_PLACEHOLDER__

# Executa o build (cria a pasta dist)
RUN npm run build


# Stage 2: Servir arquivos estáticos com Nginx
FROM nginx:alpine

# Copia a configuração padrão customizada para SPAs (opcional mas boa prática)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos gerados no build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia o script que processa as variáveis de ambiente em tempo de execução
COPY entrypoint.sh /docker-entrypoint.d/40-envsubst-vite.sh
RUN chmod +x /docker-entrypoint.d/40-envsubst-vite.sh

EXPOSE 80
# O nginx oficial já define um ENTRYPOINT que roda os scripts em /docker-entrypoint.d/ e em seguida inicia o nginx
