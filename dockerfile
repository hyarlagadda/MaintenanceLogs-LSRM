# Step 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:alpine
# Copy the built Vite assets (Vite outputs to 'dist' folder)
COPY --from=build /app/dist /usr/share/nginx/html
# Cloud Run sends traffic to port 8080 by default.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]