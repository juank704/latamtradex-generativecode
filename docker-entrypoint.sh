#!/bin/sh
set -e

PRISMA_CLI="/app/node_modules/prisma/build/index.js"

if [ ! -f "$PRISMA_CLI" ]; then
  echo "[entrypoint] ERROR: no se encontro el CLI de Prisma en $PRISMA_CLI" >&2
  exit 1
fi

echo "[entrypoint] Sincronizando esquema Prisma con la base SQLite..."
node "$PRISMA_CLI" db push \
  --schema=/app/prisma/schema.prisma \
  --accept-data-loss \
  --skip-generate

echo "[entrypoint] Arrancando Next.js standalone..."
exec "$@"
