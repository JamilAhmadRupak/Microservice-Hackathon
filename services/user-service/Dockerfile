FROM node:18-alpine

WORKDIR /app

# Copy shared utilities first
COPY shared/ /app/shared/
RUN cd /app/shared && npm install --production

# Copy service files
COPY services/user-service/package*.json ./
RUN npm install --production

COPY services/user-service/ ./

EXPOSE 3001

CMD ["node", "src/index.js"]
