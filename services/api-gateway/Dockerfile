FROM node:18-alpine

WORKDIR /app

COPY shared/ /app/shared/
COPY services/api-gateway/package*.json ./
RUN npm install --production

COPY services/api-gateway/ ./

EXPOSE 3000

CMD ["node", "src/index.js"]
