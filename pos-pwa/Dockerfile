# syntax=docker/dockerfile:1

############################
# Stage 1: Build the PWA
############################
FROM node:22-alpine AS build
WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests first to leverage Docker layer caching.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the full source tree and compile.
COPY . .

RUN pnpm run build

#####################################
# Stage 2: Serve with Nginx
#####################################
FROM nginx:stable-alpine

# Deploy static assets and service worker produced by Vite.
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx startup performs env substitution on templates from this directory.
# Runtime vars expected by the template:
# - BACKEND_HOST (service/container name of the API, e.g. suntek-app-api)
COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
