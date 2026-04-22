# ──── stage 1: build the application ───────────────────────────────────────────────

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./ # Copy package.json and package-lock.json to the working directory

RUN npm ci # Install dependencies

COPY . . # Copy the rest of the application code

RUN npm run build # compile TypeScript  dist

# ──── stage 2: run the application ───────────────────────────────────────────────

FROM node:22-alpine AS runner

WORKDIR /app 

COPY package*.json ./

RUN npm ci --omit=dev 

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]§
