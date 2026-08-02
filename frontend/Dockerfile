# ============================================
# STAGE 1: Build Stage
# ============================================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/

# Install dependencies using workspace filter
RUN pnpm install --filter kyreqo-frontend... --no-frozen-lockfile

# Copy frontend source code
COPY frontend/ ./frontend/

# Build the Vite application
RUN pnpm --filter kyreqo-frontend build


# ============================================
# STAGE 2: Production Stage (Nginx)
# ============================================
FROM nginx:alpine AS production

# Copy the built files from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]