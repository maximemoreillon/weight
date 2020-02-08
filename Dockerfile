FROM node:10
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 8633
CMD [ "node", "weight.js" ]
