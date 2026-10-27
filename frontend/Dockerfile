# Stage 1: build the React app using Node 20
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The Reverb key is passed in when the image is built
ARG REACT_APP_REVERB_APP_KEY
ENV REACT_APP_REVERB_APP_KEY=$REACT_APP_REVERB_APP_KEY

RUN npm run build

# Stage 2: a small Nginx image that holds only the finished site
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html