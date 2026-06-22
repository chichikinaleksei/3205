FROM node:22-alpine

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/web apps/web
RUN npm run build -w @url-checker/web

EXPOSE 4173

CMD ["npm", "run", "preview", "-w", "@url-checker/web", "--", "--host", "0.0.0.0", "--port", "4173"]
