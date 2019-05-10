FROM node:10.13-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --production --silent && mv node_modules ../
COPY ["src/master.js", "src/utils.js", "./src/"]
EXPOSE 3000
CMD ["node","src/master.js"]