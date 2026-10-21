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

# Configuración para SPA, Proxy API y PWA con HTTPS (QuickConnect Let's Encrypt)
RUN printf 'map $http_host $redirect_https_host {\n\
    ~^192\\.168\\.4\\.87  192-168-4-87.pvault88.direct.quickconnect.to:8081;\n\
    default            pvault88.direct.quickconnect.to:8081;\n\
}\n\
\n\
server {\n\
    listen 80 ssl;\n\
    server_name _;\n\
\n\
    ssl_certificate /etc/nginx/certs/RSA-fullchain.pem;\n\
    ssl_certificate_key /etc/nginx/certs/RSA-privkey.pem;\n\
    ssl_protocols TLSv1.2 TLSv1.3;\n\
\n\
    error_page 497 =302 https://$redirect_https_host$request_uri;\n\
\n\
    client_max_body_size 500M;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location /api/ {\n\
        proxy_pass http://backend:8080/api/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_set_header Origin "http://localhost:8081";\n\
        proxy_read_timeout 300s;\n\
        proxy_send_timeout 300s;\n\
    }\n\
\n\
    location = /sw.js {\n\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\n\
        try_files $uri =404;\n\
    }\n\
\n\
    location = /manifest.json {\n\
        default_type application/manifest+json;\n\
        add_header Cache-Control "no-cache";\n\
        try_files $uri =404;\n\
    }\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
