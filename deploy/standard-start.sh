#!/bin/sh
set -eu

# The upstream entrypoint generates PreConfig.js before invoking this command.
# Install the local-file configuration after initialization and before Tomcat.
cp /opt/drawio-standard/PreConfig.js /usr/local/tomcat/webapps/draw/js/PreConfig.js
exec "$@"
