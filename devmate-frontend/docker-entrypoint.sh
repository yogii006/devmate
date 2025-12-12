#!/bin/sh
set -e

# Generate runtime env file for the frontend
: ${REACT_APP_API_URL:=http://localhost:8000}
cat > /usr/share/nginx/html/env.js <<EOF
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL}"
};
EOF

# If any extra command passed, exec it; otherwise start nginx (CMD)
exec "$@"
