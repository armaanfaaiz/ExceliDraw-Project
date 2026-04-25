FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./
COPY ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm exec tsc -b

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "./dist/index.js"]
