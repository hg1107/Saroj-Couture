# Saroj Couture — production image (Next.js standalone server + migration runner).
# Built by ../docker-compose.yml. Works on amd64 and arm64 (e.g. Oracle Cloud Ampere).

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Baked into the client bundle at build time.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/data/storage

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Maintenance scripts (run with plain `node`, which strips TypeScript types)
# and the source files they import.
COPY --from=build /app/db ./db
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib/auth/password.ts ./lib/auth/password.ts
COPY --from=build /app/lib/storage ./lib/storage
COPY --from=build /app/lib/utils/image-processing.ts ./lib/utils/image-processing.ts
COPY --from=build /app/node_modules/postgres ./node_modules/postgres

# Photos live on a volume mounted here; pre-create it so the volume inherits
# the non-root owner.
RUN mkdir -p /data/storage && chown -R node:node /data/storage
USER node

EXPOSE 3000
CMD ["sh", "-c", "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/migrate.ts && exec node server.js"]
