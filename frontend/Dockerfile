# --- ETAPA DE CONSTRUCCIÓN (BUILD) ---
    FROM node:22-alpine AS build
    WORKDIR /app
    
    # VITE_API_URL ahora será simplemente "/api" (ruta relativa)
    ARG VITE_API_URL=/api
    ENV VITE_APP_API_URL=$VITE_API_URL
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build
    
    # --- ETAPA FINAL (RUNTIME) ---
    FROM nginx:alpine
    
    # Copiamos el build de React
    COPY --from=build /app/dist /usr/share/nginx/html
    
    # Copiamos el template en la carpeta especial de Nginx
    COPY default.conf.template /etc/nginx/templates/default.conf.template
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]