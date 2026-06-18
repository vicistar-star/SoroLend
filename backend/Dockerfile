FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM base AS development
RUN npm ci
COPY . .
CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
CMD ["npm", "run", "start:prod"]
