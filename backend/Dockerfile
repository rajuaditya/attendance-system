FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads/profile-photos logs

EXPOSE 5000

CMD ["sh", "-c", "node src/seeders/seed.js; node src/server.js"]
