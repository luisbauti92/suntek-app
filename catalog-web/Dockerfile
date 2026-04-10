# syntax=docker/dockerfile:1

############################
# Stage 1: Build the SPA
############################
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching.
COPY package*.json ./
RUN npm ci

# Copy the full source tree and compile.
COPY . .

# Build-time variable consumed by Vite (`import.meta.env.VITE_API_BASE_URL`).
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

#####################################
# Stage 2: Serve with Nginx
#####################################
FROM nginx:stable-alpine

# Deploy static assets produced by Vite.
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx startup performs env substitution on templates from this directory.
# Runtime vars expected by the template:
# - BACKEND_HOST (service/container name of the API)
# - CATALOG_API_KEY (shared key sent as X-Catalog-Key)
COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
