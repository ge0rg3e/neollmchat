FROM oven/bun

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

COPY . .

ENV NODE_ENV=production

# Install deps
RUN bun install

# Build frontend
RUN bun ui:build
RUN ls -l /app/build/frontend
RUN chmod -R 755 /app/build/frontend

# Generate db schema
RUN bun db:generate

CMD ["bun", "server/index.ts"]

EXPOSE 8608