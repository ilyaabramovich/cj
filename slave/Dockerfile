# FROM nsjail:latest

# RUN "mkdir -p /arch/nsjail_cfgs"
# COPY ./nsjail_cfgs /arch/nsjail_cfgs
# COPY src/slave.js /arch

# WORKDIR /arch/slave

# CMD ["node", "master.js"]
# FROM nsjail
FROM node:latest
ENV NODE_ENV production
RUN apt-get update && apt-get install -y default-jdk
RUN mkdir -p /arch/slave
WORKDIR /arch/slave
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --production --silent
COPY nsjail_cfgs .
COPY ["src/slave.js", "src/utils.js", "./src/"]
CMD ["node", "src/slave.js"]
