FROM arm32v7/node:alpine

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

WORKDIR /app
ADD . ./
RUN chown -R node:node /app
USER node
RUN npm ci

ENTRYPOINT [ "node", "./octoprint-connector.js" ]
