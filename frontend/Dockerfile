FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Exponer el puerto configurado en vite.config.ts
EXPOSE 5176

# Comando para ejecutar Vite en modo desarrollo
CMD ["npm", "run", "dev"]
