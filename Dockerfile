FROM node:8 as prebuild
RUN npm install -g aurelia-cli yarn
WORKDIR /src
COPY package.json /src/package.json
RUN yarn


FROM prebuild as build
WORKDIR /src
COPY . /src
RUN mkdir /deploy
RUN au deploy --env stage --out /deploy


FROM nginx:latest
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /deploy /webroot
