FROM node:18-alpine

WORKDIR /app

COPY shared/ /app/shared/
COPY services/pledge-service/package*.json ./
RUN npm install --production

COPY services/pledge-service/ ./

EXPOSE 3003

CMD ["node", "src/index.js"]
