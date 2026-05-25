# Stage 1: Compile Workspace
FROM node:20-alpine AS build

WORKDIR /workspace

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine

COPY --from=build /workspace/dist /usr/share/nginx/html
COPY --from=build /workspace/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
