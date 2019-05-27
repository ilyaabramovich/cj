FROM tsuro/nsjail
ENV NODE_ENV production
RUN apt-get update && apt-get install -y default-jdk
RUN apt-get install -y curl software-properties-common
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs
WORKDIR /usr/src/app
COPY ["package.json", "yarn.lock", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY nsjail_cfgs .
COPY . .
CMD ["node", "src/slave.js"]
