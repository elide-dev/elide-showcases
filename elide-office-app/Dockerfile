# Elide Office Coordinator - Docker Image
# Lightweight container for Digital Ocean $7/mo droplet

FROM ubuntu:24.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Elide (latest stable)
RUN curl -sSL --tlsv1.2 https://elide.sh | bash -s - --yes

# Add Elide to PATH
ENV PATH="/root/elide:${PATH}"

# Verify installation
RUN elide --version

# Create app directory
WORKDIR /app

# Copy application files
COPY server.js ./
COPY data/ ./data/

# Create data directory if it doesn't exist
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Environment
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start server
CMD ["elide", "run", "--serve", "server.js"]
