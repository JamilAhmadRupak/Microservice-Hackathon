FROM node:18-alpine

WORKDIR /app

COPY shared/ /app/shared/
COPY services/campaign-service/package*.json ./
RUN npm install --production

COPY services/campaign-service/ ./

EXPOSE 3002

CMD ["node", "src/index.js"]
