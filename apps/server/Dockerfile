FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
COPY prisma ./prisma/
RUN npm install
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
RUN npm run build -w @vkvize/shared && npm run build -w @vkvize/server && npx prisma generate

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
