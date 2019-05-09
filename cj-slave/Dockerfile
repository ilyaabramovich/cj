# FROM nsjail:latest

# RUN "mkdir -p /arch/nsjail_cfgs"
# COPY ./nsjail_cfgs /arch/nsjail_cfgs
# COPY src/slave.js /arch

# WORKDIR /arch/slave

# CMD ["node", "master.js"]
FROM node:10.13-alpine
WORKDIR /arch
COPY nsjail_cfgs .
COPY ["src/slave.js", "src/utils.js", "./src/"]