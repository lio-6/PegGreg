# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite needs to know the backend URL at build time
# We pass it in from docker-compose as a build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build               # outputs to dist/


# ── Stage 2: Serve ──────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy compiled static files into Nginx's serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config — needed to make React Router work correctly
# Without this, refreshing on /groups/123 returns a 404
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
