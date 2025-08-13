# Use Ubuntu as base image
FROM ubuntu:24.04

# Set working directory
WORKDIR /app

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_QUERY_ENGINE_BINARY=.prisma

# Install OpenSSL, ffmpeg and Python
RUN apt-get update && apt-get install -y \
    sudo \
    openssl \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Whisper
RUN pip3 install --no-cache-dir --break-system-packages -U faster-whisper

# Copy app build
COPY /build .

# Make sure it's executable
RUN chmod +x /app

# Run app
CMD ["./app"]

# Expose port
EXPOSE 8608