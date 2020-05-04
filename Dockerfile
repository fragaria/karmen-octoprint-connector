FROM node:14-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

WORKDIR /app
ADD . ./
RUN chown -R node:node /app
USER node
RUN npm ci

ENTRYPOINT [ "node", "./octoprint-connector.js" ]
