FROM nginx:1.21

RUN set -eux; \
        apt-get update; \
        apt-get install -y --no-install-recommends \
                netcat \
        ; \
        rm -rf /var/lib/apt/lists/*

COPY wait-for-it.sh /usr/bin/wait-for-it.sh

CMD ["nginx", "-g", "daemon off;"]
