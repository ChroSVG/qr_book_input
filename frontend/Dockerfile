# Stage 1: Build
FROM node:22-alpine AS builder

# Build arguments
ARG VITE_API_BASE
ARG VITE_API_KEY

ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_API_KEY=${VITE_API_KEY}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
