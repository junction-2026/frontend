FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# The stock entrypoint renders /etc/nginx/templates/*.template, substituting ${BACKEND_URL}.
ENV BACKEND_URL=http://host.docker.internal:8080
# Public origin for Open Graph/Twitter link previews (no trailing slash); set it to the real site in production.
ENV PUBLIC_ORIGIN=http://localhost
# njs ships with nginx:alpine; load it in the main context.
RUN sed -i '1i load_module modules/ngx_http_js_module.so;' /etc/nginx/nginx.conf
COPY nginx/og.js nginx/og-handler.js /etc/nginx/njs/
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
