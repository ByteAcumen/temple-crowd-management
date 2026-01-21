# Use lightweight Node.js Alpine image
FROM node:18-alpine

# Security: Run as non-root user (node)
USER node

# Create app directory with permissions
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

# Copy package files (optimize caching)
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY --chown=node:node . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
