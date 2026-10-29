# Stage 1: build the React app using Node 20
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# These values are passed in when the image is built
ARG REACT_APP_REVERB_APP_KEY
ARG REACT_APP_API_URL
ARG REACT_APP_REVERB_HOST
ARG REACT_APP_REVERB_PORT
ARG REACT_APP_REVERB_SCHEME
ENV REACT_APP_REVERB_APP_KEY=$REACT_APP_REVERB_APP_KEY \
    REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_REVERB_HOST=$REACT_APP_REVERB_HOST \
    REACT_APP_REVERB_PORT=$REACT_APP_REVERB_PORT \
    REACT_APP_REVERB_SCHEME=$REACT_APP_REVERB_SCHEME

ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Stage 2: a small Nginx image that holds only the finished site
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html