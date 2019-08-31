
FROM node:alpine
WORKDIR "/app"
COPY ./package.json ./
RUN npm install
COPY . .
EXPOSE 8081
EXPOSE 5432
CMD ["npm", "run", "start"]