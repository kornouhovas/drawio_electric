# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS electric-check
WORKDIR /workspace
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN node --check src/main/webapp/js/diagramly/Electric.js \
    && node --check src/main/webapp/js/diagramly/ElectricShapes.js \
    && node --test test/electric-*.test.js \
    && python3 tools/electric_shapes/verify_electric_shapes.py src/main/webapp/electric/shapes \
    && python3 tools/electric_shapes/generate_electric_shapes.py \
        tools/electric_shapes/source/base.drawio.gz /tmp/electric-shapes \
    && diff -qr src/main/webapp/electric/shapes /tmp/electric-shapes \
    && touch /electric-check-passed

FROM eclipse-temurin:17-jdk-jammy@sha256:723151f3fc88ca2060153ee08ab8dbbea7983d6ed6f2622fe440acf178737c94 AS builder
WORKDIR /workspace
COPY --from=electric-check /electric-check-passed /electric-check-passed
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ant ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cd etc/build && ant -f build.xml war

FROM jgraph/drawio@sha256:b0791d8f4cd4e50600ad2ff4e0c5ea51bc7adb59c782da50214db0511db03106
USER root
RUN rm -rf /usr/local/tomcat/webapps/draw /usr/local/tomcat/webapps/draw.war
COPY --chown=tomcat:tomcat --from=builder /workspace/src/main/webapp/ /usr/local/tomcat/webapps/draw/
COPY --chown=tomcat:tomcat deploy/PreConfig.js /usr/local/tomcat/webapps/draw/js/PreConfig.js
USER tomcat
