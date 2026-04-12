# ---- Build Stage ----
FROM node:20-alpine AS build

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/bot/package.json ./packages/bot/

RUN npm ci

# Copy source and build
COPY tsconfig.base.json ./
COPY packages/ ./packages/

RUN npm run build && npm prune --omit=dev

# ---- Server ----
FROM node:20-alpine AS server
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["node", "packages/server/dist/app.js"]

# ---- Bot ----
FROM node:20-alpine AS bot
WORKDIR /app
COPY --from=build /app ./
CMD ["node", "packages/bot/dist/app.js"]
