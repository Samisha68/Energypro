FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    linux-headers \
    eudev-dev \
    libusb-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application (without migrations during build)
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Create a startup script
RUN echo '#!/bin/sh\nnpx prisma migrate deploy\nnpm start' > /app/start.sh && chmod +x /app/start.sh

# Start the application with migrations
CMD ["/app/start.sh"] 