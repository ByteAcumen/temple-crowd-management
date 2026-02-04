# ========================================
# GitHub Actions Secrets Required
# ========================================
# 
# Add these secrets to your GitHub repository:
# Settings > Secrets and Variables > Actions > New repository secret
#
# ==========================================
# REQUIRED SECRETS
# ==========================================

# JWT_SECRET (Required for tests)
# A secure random string for JWT token signing
# Example: openssl rand -hex 32
JWT_SECRET=your-secure-jwt-secret-key-here

# ==========================================
# OPTIONAL SECRETS (for deployment)
# ==========================================

# Docker Registry Credentials (if using private registry)
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Staging Server SSH
STAGING_SSH_HOST=staging.example.com
STAGING_SSH_USER=deploy
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...

# Production Server SSH
PRODUCTION_SSH_HOST=production.example.com
PRODUCTION_SSH_USER=deploy
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Database Connection (Production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/temple
REDIS_URL=redis://user:pass@redis-host:6379

# ==========================================
# Environment Variables (Auto-set by GitHub)
# ==========================================
# GITHUB_TOKEN - Automatically provided
# GITHUB_ACTOR - Automatically provided
# GITHUB_REPOSITORY - Automatically provided

# ==========================================
# How to add a secret
# ==========================================
# 1. Go to your GitHub repository
# 2. Click Settings > Secrets and variables > Actions
# 3. Click "New repository secret"
# 4. Enter the name (e.g., JWT_SECRET)
# 5. Enter the value
# 6. Click "Add secret"
#
# ==========================================
# For Production Deployment
# ==========================================
# Create GitHub Environments:
# 1. Settings > Environments > New environment
# 2. Create "staging" and "production" environments
# 3. Add protection rules for production:
#    - Required reviewers
#    - Wait timer (optional)
#    - Deployment branches (only main)
