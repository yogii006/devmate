
FROM node:18-alpine as build

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine
ARG REACT_APP_API_URL
COPY --from=build /app/build /usr/share/nginx/html

# Copy entrypoint that will write runtime env (env.js) into the built assets
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
