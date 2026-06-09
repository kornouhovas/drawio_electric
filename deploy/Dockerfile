# syntax=docker/dockerfile:1.7

FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /workspace
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ant ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cd etc/build && ant -f build.xml war

FROM jgraph/drawio:latest
USER root
RUN rm -rf /usr/local/tomcat/webapps/draw /usr/local/tomcat/webapps/draw.war
COPY --chown=tomcat:tomcat --from=builder /workspace/src/main/webapp/ /usr/local/tomcat/webapps/draw/
COPY --chown=tomcat:tomcat deploy/PreConfig.js /usr/local/tomcat/webapps/draw/js/PreConfig.js
USER tomcat
