#!/bin/sh
set -eu

# The upstream entrypoint generates PreConfig.js before invoking this command.
# Install the Electric configuration after that initialization and before Tomcat.
cp /opt/drawio-electric/PreConfig.js /usr/local/tomcat/webapps/draw/js/PreConfig.js
exec "$@"
