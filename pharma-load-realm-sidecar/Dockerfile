FROM python:3.8-bullseye

RUN apt-get update && apt install -y dumb-init wget netcat

RUN mkdir /app
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY wait-for /usr/bin/wait-for
COPY entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh
COPY data.py .
COPY load_keycloak_realm.py .

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/usr/bin/entrypoint.sh"]
