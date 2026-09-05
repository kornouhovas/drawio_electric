# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS electric-check
WORKDIR /workspace
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN node --check src/main/webapp/js/diagramly/ElectricShapes.js \
    && node --check src/main/webapp/js/diagramly/App.js \
    && node --check src/main/webapp/js/diagramly/Menus.js \
    && node --check src/main/webapp/js/bootstrap.js \
    && node --check deploy/PreConfig.js \
    && node --test test/electric-*.test.js test/standard-ui.test.js \
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
RUN javap -verbose src/main/webapp/WEB-INF/classes/com/mxgraph/online/ExportProxyServlet.class \
    | grep -q 'major version: 55'
RUN find src/main/webapp/stencils src/main/webapp/electric/shapes/items \
        -type f -name '*.xml' -size +1024c -exec gzip -9 -k -f {} + \
    && find src/main/webapp/js src/main/webapp/styles \
        -type f \( -name '*.js' -o -name '*.css' \) -size +1024c \
        -exec gzip -9 -k -f {} +

FROM jgraph/drawio@sha256:b0791d8f4cd4e50600ad2ff4e0c5ea51bc7adb59c782da50214db0511db03106
ARG DRAWIO_ASSET_VERSION=local
USER root
RUN rm -rf /usr/local/tomcat/webapps/draw /usr/local/tomcat/webapps/draw.war \
    && sed -i '/<load-on-startup>1<\/load-on-startup>/i\
        <init-param>\
            <param-name>precompressed</param-name>\
            <param-value>gzip=.gz</param-value>\
        </init-param>' /usr/local/tomcat/conf/web.xml
COPY --chown=tomcat:tomcat --from=builder /workspace/src/main/webapp/ /usr/local/tomcat/webapps/draw/
COPY --chown=tomcat:tomcat deploy/PreConfig.js /opt/drawio-standard/PreConfig.js
RUN sed -i "s/@DRAWIO_ASSET_VERSION@/${DRAWIO_ASSET_VERSION}/g" \
        /opt/drawio-standard/PreConfig.js
COPY --chmod=0755 --chown=tomcat:tomcat deploy/standard-start.sh /usr/local/bin/standard-start.sh
USER tomcat
CMD ["/usr/local/bin/standard-start.sh", "catalina.sh", "run"]
