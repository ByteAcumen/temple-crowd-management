# ============================================
# PRODUCTION-GRADE MULTI-STAGE DOCKERFILE
# Temple Crowd Management Backend
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for building)
RUN npm ci

# ============================================
# Stage 2: Production Build
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    dumb-init \
    tini

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Environment variables
ENV NODE_ENV=production \
    PORT=5001 \
    # Graceful shutdown timeout (ms)
    SHUTDOWN_TIMEOUT=10000

# Expose port
EXPOSE 5001

# Switch to non-root user
USER nodejs

# Health check with timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5001/api/v1/health || exit 1

# Use tini for proper signal handling (graceful shutdown)
ENTRYPOINT ["/sbin/tini", "--"]

# Start server
CMD ["node", "src/server.js"]
