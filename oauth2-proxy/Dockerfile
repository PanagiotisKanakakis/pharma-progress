FROM quay.io/oauth2-proxy/oauth2-proxy:v7.2.1

USER root

RUN apk add --update --no-cache netcat-openbsd wget dumb-init

COPY wait-for /usr/bin/wait-for
COPY entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh

USER 2000:2000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/usr/bin/entrypoint.sh"]

