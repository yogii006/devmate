#!/bin/sh
set -euo pipefail

# Write runtime env for frontend
: ${REACT_APP_API_URL:=}
cat > /var/www/html/env.js <<EOF
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL}"
};
EOF

# Determine the port Render expects us to bind to. Render provides $PORT at runtime.
# Fallback to 80 when not set (local runs).
: ${PORT:=80}

# Ensure nginx listens on the correct port by replacing the hard-coded listen directive
# in the nginx site config that was copied during image build.
NGINX_SITE_CONF="/etc/nginx/sites-available/default"
if [ -f "$NGINX_SITE_CONF" ]; then
  echo "Patching $NGINX_SITE_CONF to listen on port $PORT"
  # Replace 'listen 80;' (possibly with spaces) with the desired port
  sed -E -i "s/listen[[:space:]]+[0-9]+;/listen $PORT;/g" "$NGINX_SITE_CONF" || true
else
  echo "Warning: $NGINX_SITE_CONF not found; skipping port patch"
fi

# Ensure log dirs exist
mkdir -p /var/log/uvicorn
mkdir -p /var/log/nginx

echo "Starting supervisord..."
# Start supervisord (will run nginx and uvicorn)
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
