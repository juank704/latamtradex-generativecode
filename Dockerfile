# ============================================================
# Latamtradex - Dockerfile multi-stage (Next.js standalone)
# ============================================================

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
# Evita que @playwright/test descargue navegadores en la instalacion
# (en Alpine usamos el Chromium del sistema instalado en la etapa builder).
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# ---------- Stage 2: builder ----------
# Esta etapa incluye TODO el toolchain de desarrollo y se usa tambien para
# ejecutar las pruebas (Jest unitarias y Playwright E2E).
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
# Chromium del sistema + dependencias para Playwright en Alpine.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL placeholder solo para build (la real se inyecta en runtime via docker-compose)
ENV DATABASE_URL="file:./build-placeholder.db"
# Playwright usa el Chromium del sistema (no descarga binarios propios).
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium-browser
RUN npx prisma generate
RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner
# dos2unix por si el entrypoint llega con saltos de linea CRLF desde Windows
RUN apk add --no-cache openssl dos2unix
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Permite que un eventual "prisma" sea encontrado tambien por PATH
ENV PATH=/app/node_modules/.bin:$PATH

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Carpetas de datos y uploads
RUN mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app

# Copiar artefactos del build standalone
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma: schema, cliente generado, CLI y sus binarios .bin
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# Script de arranque (se normaliza por si trae CRLF desde Windows)
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN dos2unix /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
