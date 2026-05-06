FROM node:20-alpine

WORKDIR /workspace

# ── 1. Build the Vite frontend ───────────────────────────────────────────
COPY app/package*.json ./app/
RUN cd app && npm install --legacy-peer-deps

COPY app/ ./app/
RUN cd app && npm run build

# ── 2. Set up the payment + static-file server ───────────────────────────
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --legacy-peer-deps

COPY server/ ./server/

# ── 3. Runtime config ────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=7860

EXPOSE 7860

CMD ["node", "server/src/index.js"]
