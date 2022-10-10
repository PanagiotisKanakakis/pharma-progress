FROM node:16-buster

# include some dev tools
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    net-tools \
    dnsutils \
    htop \
    mc \
    vim \
    && rm -rf /var/lib/apt/lists/*

#USER node

RUN mkdir /home/node/app
WORKDIR /home/node/app
RUN npm install -g @angular/cli
COPY  package.json ./
COPY  package-lock.json ./

RUN npm install --legacy-peer-deps

EXPOSE 3000
CMD ["ng", "serve","--host","0.0.0.0","--port","3000", "--disable-host-check", "--hmr"]

