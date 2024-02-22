# Указываем базовый образ
FROM node:20

# Устанавливаем рабочую директорию в контейнере
WORKDIR /usr/src/goslink-api

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код приложения
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт, который слушает ваше приложение
EXPOSE 3000

# Запускаем приложение из папки dist
CMD ["node", "dist/app.js"]