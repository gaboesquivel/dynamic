# Multi-stage build for NestJS app optimized for Cloud Run

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY turbo.json ./

# Copy package configurations
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/

# Copy app package.json and source
COPY apps/vencura/package.json ./apps/vencura/
COPY apps/vencura/tsconfig*.json ./apps/vencura/
COPY apps/vencura/nest-cli.json ./apps/vencura/
COPY apps/vencura/src ./apps/vencura/src/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/apps/vencura
RUN pnpm build

# Runtime stage
FROM node:20-alpine AS runtime

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy only production dependencies from packages
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/

# Copy app package.json and built files from builder stage
COPY apps/vencura/package.json ./apps/vencura/
COPY --from=builder /app/apps/vencura/dist ./apps/vencura/dist/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3077

# Expose port
EXPOSE 3077

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3077/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
WORKDIR /app/apps/vencura
CMD ["node", "dist/main.js"]
