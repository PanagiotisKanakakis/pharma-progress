FROM node:16-buster

# include some dev tools
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    net-tools \
    dnsutils \
    htop \
    mc \
    vim \
    less \
    postgresql-client \
    dumb-init \
    netcat \
    && rm -rf /var/lib/apt/lists/*

RUN wget -O /usr/local/bin/wait-for https://github.com/eficode/wait-for/releases/download/v2.2.2/wait-for
RUN chmod +x /usr/local/bin/wait-for

USER node

RUN mkdir /home/node/app && chown node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package.json /home/node/app
COPY --chown=node:node package-lock.json /home/node/app

RUN npm ci

COPY --chown=node:node . /home/node/app

RUN npm run build

EXPOSE 3000
EXPOSE 9229

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/home/node/app/entrypoint.sh"]

