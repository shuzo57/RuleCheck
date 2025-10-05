# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./

# 重要: 相対パスにする（/api）
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build
# 以降は Cloud Build 等で /app/dist を GCS に rsync して終わり