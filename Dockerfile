# syntax=docker/dockerfile:1
# Static SPA image: build with Node (version from .nvmrc), serve dist/ with unprivileged nginx on 8080.
# Expects package.json + package-lock.json with a `build` script that writes dist/ (Vite default).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
