FROM node:18-alpine

WORKDIR /app

COPY shared/ /app/shared/
RUN cd /app/shared && npm install --production

COPY services/notification-service/package*.json ./
RUN npm install --production

COPY services/notification-service/ ./

EXPOSE 3005

CMD ["node", "src/index.js"]
