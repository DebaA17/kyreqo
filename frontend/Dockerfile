# ============================================
# STAGE 1: Build Stage
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY frontend/package.json ./
COPY pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Install TypeScript globally 
RUN npm install -g typescript

# Copy the rest of the frontend code
COPY frontend/ .

#Install TypeScript locally 
RUN pnpm add -D typescript

# Build the Vite application
RUN pnpm build


# ============================================
# STAGE 2: Production Stage (Nginx)
# ============================================
FROM nginx:alpine AS production

# Copy the built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]