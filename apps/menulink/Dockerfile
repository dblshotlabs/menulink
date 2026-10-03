FROM oven/bun:1.3.0 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
# Build-time values validate configuration but never connect to a real service.
RUN APP_URL=https://menu.example.test BETTER_AUTH_URL=https://menu.example.test DATABASE_URL=postgres://build:build@localhost:5432/build BETTER_AUTH_SECRET=build-placeholder-secret-32-characters-only bun run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "start"]
