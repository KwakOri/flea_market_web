# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS dev
WORKDIR /app

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3002"]
