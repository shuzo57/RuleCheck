FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./

ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build
