FROM node:18-alpine

WORKDIR /app

COPY shared/ /app/shared/
RUN cd /app/shared && npm install --production

COPY services/payment-service/package*.json ./
RUN npm install --production

COPY services/payment-service/ ./

EXPOSE 3004

CMD ["node", "src/index.js"]
