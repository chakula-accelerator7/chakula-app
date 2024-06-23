FROM ghcr.io/puppeteer/puppeteer:22.10.0
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY packahe*.json ./
RUN npm ci
COPY . .
CMD ["node", "server.js"]
