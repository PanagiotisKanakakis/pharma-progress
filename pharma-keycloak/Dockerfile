FROM maven:3.6.0-jdk-11-slim AS gelf-builder
RUN useradd -m -u 1000 user
USER user
WORKDIR /home/user
RUN mvn dependency:get -Dartifact=io.quarkus:quarkus-logging-gelf:2.7.0.Final -Ddest=/home/user/quarkus-logging-gelf-2.7.0.Final.jar
RUN mvn dependency:get -Dartifact=io.quarkus:quarkus-logging-gelf-deployment:2.7.0.Final -Ddest=/home/user/quarkus-logging-gelf-deployment-2.7.0.Final.jar
RUN mvn dependency:get -Dartifact=biz.paluch.logging:logstash-gelf:1.15.0 -Ddest=/home/user/logstash-gelf-1.15.0.jar

FROM quay.io/keycloak/keycloak:nightly as builder

USER root
RUN microdnf install zip unzip
USER 1000

COPY --from=gelf-builder --chown=1000:root /home/user/quarkus-logging-gelf-2.7.0.Final.jar /opt/keycloak/providers/quarkus-logging-gelf-2.7.0.Final.jar
COPY --from=gelf-builder --chown=1000:root /home/user/quarkus-logging-gelf-deployment-2.7.0.Final.jar /opt/keycloak/providers/quarkus-logging-gelf-deployment-2.7.0.Final.jar
COPY --from=gelf-builder --chown=1000:root /home/user/logstash-gelf-1.15.0.jar /opt/keycloak/providers/logstash-gelf-1.15.0.jar

ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build --features=authorization,impersonation



FROM quay.io/keycloak/keycloak:nightly

COPY --from=builder /opt/keycloak/lib/quarkus/ /opt/keycloak/lib/quarkus/
COPY --from=builder /opt/keycloak/providers/quarkus-logging-gelf-2.7.0.Final.jar /opt/keycloak/providers/quarkus-logging-gelf-2.7.0.Final.jar
COPY --from=builder /opt/keycloak/providers/quarkus-logging-gelf-2.7.0.Final.jar /opt/keycloak/lib/lib/main/quarkus-logging-gelf-2.7.0.Final.jar
COPY --from=builder /opt/keycloak/providers/quarkus-logging-gelf-deployment-2.7.0.Final.jar /opt/keycloak/providers/quarkus-logging-gelf-deployment-2.7.0.Final.jar
COPY --from=builder /opt/keycloak/providers/quarkus-logging-gelf-deployment-2.7.0.Final.jar /opt/keycloak/lib/lib/main/quarkus-logging-gelf-deployment-2.7.0.Final.jar
COPY --from=builder /opt/keycloak/providers/logstash-gelf-1.15.0.jar /opt/keycloak/providers/logstash-gelf-1.15.0.jar

WORKDIR /opt/keycloak

ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "--verbose", "start", "--import-realm"]
