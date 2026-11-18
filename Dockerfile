# Multi-stage production Dockerfile for Dragnet

# Stage 1: Build Next.js Web App
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Final Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder /app/demo-repos ./demo-repos
COPY --from=frontend-builder /app/docs ./docs

EXPOSE 3000
CMD ["npm", "start"]
