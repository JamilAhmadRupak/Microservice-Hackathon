FROM node:18-alpine

WORKDIR /app

COPY shared/ /app/shared/
RUN cd /app/shared && npm install --production

COPY services/admin-service/package*.json ./
RUN npm install --production

COPY services/admin-service/ ./

EXPOSE 3006

CMD ["node", "src/index.js"]
