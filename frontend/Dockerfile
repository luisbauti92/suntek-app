# --- ETAPA DE CONSTRUCCIÓN (BUILD) ---
    FROM node:22-alpine AS build
    WORKDIR /app
    
    # Definimos el argumento para la URL del API
    ARG VITE_API_URL
    ENV VITE_APP_API_URL=$VITE_API_URL
    
    # Copiamos archivos de dependencias
    COPY package*.json ./
    RUN npm install
    
    # Copiamos el resto del código y construimos
    COPY . .
    RUN npm run build
    
    # --- ETAPA FINAL (RUNTIME) ---
    FROM nginx:alpine
    # Copiamos el build de React a la carpeta de Nginx
    COPY --from=build /app/dist /usr/share/nginx/html
    # Copiamos la configuración personalizada de Nginx (si la tienes)
    # COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]