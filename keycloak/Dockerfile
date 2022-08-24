FROM maven:3.6.0-jdk-11-slim AS theme-builder

RUN useradd -m -u 1000 user
USER user
WORKDIR /home/user
COPY --chown=1000:1000 keycloak-govgr-theme/pom.xml .
RUN mvn -B -e -C -T 1C org.apache.maven.plugins:maven-dependency-plugin:3.1.2:go-offline
COPY --chown=1000:1000 keycloak-govgr-theme/src ./src
RUN ls -l /home/user
RUN mvn -B package



FROM quay.io/keycloak/keycloak:17.0.1 as builder

USER root
RUN microdnf install zip unzip
USER 1000

ADD policies /tmp/js-custom-policies
RUN cd /tmp/js-custom-policies \
 && zip -9r /tmp/policies.jar * \
 && cp /tmp/policies.jar /opt/keycloak/providers/

COPY --from=theme-builder --chown=1000:root /home/user/target/govgr-keycloak-theme.jar /opt/keycloak/providers/theme.jar

ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build --features=authorization,impersonation



FROM quay.io/keycloak/keycloak:17.0.1

COPY --from=builder /opt/keycloak/lib/quarkus/ /opt/keycloak/lib/quarkus/
COPY --from=builder /opt/keycloak/providers/policies.jar /opt/keycloak/providers/policies.jar
COPY --from=builder /opt/keycloak/providers/theme.jar /opt/keycloak/providers/theme.jar
WORKDIR /opt/keycloak

ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "--verbose", "start"]
