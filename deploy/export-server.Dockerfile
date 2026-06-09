FROM jgraph/export-server:latest

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*

USER pptruser
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer
RUN rm -rf /home/pptruser/.cache/puppeteer/chrome/linux-148.0.7778.97 \
    && PUPPETEER_SKIP_CHROMIUM_DOWNLOAD= npx puppeteer browsers install chrome || true \
    && mkdir -p /home/pptruser/.cache/puppeteer/chrome/linux-148.0.7778.97 \
    && cd /home/pptruser/.cache/puppeteer/chrome/linux-148.0.7778.97 \
    && unzip -q -o ../148.0.7778.97-chrome-linux64.zip \
    && chmod +x chrome-linux64/chrome \
    && test -x chrome-linux64/chrome
