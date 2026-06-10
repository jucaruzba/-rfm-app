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

# Configuración para SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
