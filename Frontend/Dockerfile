# Stage 1: Build Frontend
FROM node:20-alpine AS builder

# Set directory kerja di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json terlebih dahulu untuk cache layer yang optimal
COPY package.json package-lock.json ./

# Install dependensi
RUN npm ci

# Copy seluruh file project
COPY . .

# Pass environment variable API URL saat build (opsional)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build production bundle ke folder dist/
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:alpine

# Hapus konfigurasi default nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy konfigurasi nginx buatan kita
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy file hasil build dari tahap builder ke direktori HTML nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Ekspos port 80
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]
