FROM node:22-slim

WORKDIR /app

# Copy package files first for better cache
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Install system dependencies (curl, python3, yt-dlp, chromium for puppeteer)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    python3 \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends && \
    update-ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://127.0.0.1:3001/api/health || exit 1

# Start server
CMD ["node", "src/index.js"]
