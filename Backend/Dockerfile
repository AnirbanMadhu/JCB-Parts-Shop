FROM node:20-alpine

WORKDIR /app

COPY package*.json tsconfig.json prisma ./ 
RUN npm install

COPY src ./src

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
