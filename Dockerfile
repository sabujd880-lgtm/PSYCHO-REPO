# Production Dockerfile for Psychology Knowledge & Intelligence Platform
FROM node:22-alpine

WORKDIR /app

# Copy root and server configuration
COPY package.json ./
COPY tsconfig.json ./

# Copy application code, database shadow schema, and static assets
COPY public ./public
COPY data ./data
COPY server ./server

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=10000

# Expose Render web service port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health || exit 1

# Start the Node 22 native TypeScript server
CMD ["node", "--experimental-strip-types", "server/src/server.ts"]
