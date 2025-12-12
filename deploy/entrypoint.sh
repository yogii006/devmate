#!/bin/sh
set -e

# Write runtime env for frontend
: ${REACT_APP_API_URL:=}
cat > /var/www/html/env.js <<EOF
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL}"
};
EOF

# Ensure log dirs exist
mkdir -p /var/log/uvicorn
mkdir -p /var/log/nginx

# Start supervisord (will run nginx and uvicorn)
exec /usr/bin/supervisord -n
