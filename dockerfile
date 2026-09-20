# Step 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_SUPABASE_API_URL
ENV VITE_SUPABASE_API_URL=$VITE_SUPABASE_API_URL

ARG VITE_SUPABASE_API_KEY
ENV VITE_SUPABASE_API_KEY=$VITE_SUPABASE_API_KEY

ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

ARG VITE_SUPABASEPROJECT_ID
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:alpine
# Copy the built Vite assets (Vite outputs to 'dist' folder)
COPY --from=build /app/dist /usr/share/nginx/html
# Cloud Run sends traffic to port 8080 by default.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]