FROM node:20-alpine AS build
WORKDIR /app

# Copiar dependencias
COPY package*.json ./
COPY package-lock.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Aceptar la variable de entorno
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Mostrar la URL durante el build (debug)
RUN echo "🔧 Building with VITE_API_BASE_URL: $VITE_API_BASE_URL"

# Construir la aplicación
RUN npm run build

# Servir con Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Configuración para SPA y PWA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location = /sw.js { \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        try_files $uri =404; \
    } \
    location = /manifest.json { \
        default_type application/manifest+json; \
        add_header Cache-Control "no-cache"; \
        try_files $uri =404; \
    } \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
