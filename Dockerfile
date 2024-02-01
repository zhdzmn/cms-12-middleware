FROM node:16.18.1 AS deps

WORKDIR /code
COPY package.json yarn.lock ./
RUN yarn install --ignore-optional


FROM node:16.18.1-slim

RUN apt update -y
RUN apt install -y curl
ENV NODE_ENV=development
WORKDIR /code
RUN mkdir -p /var/log/cms-12-middleware && chown node /var/log/cms-12-middleware
COPY ./ /code
COPY --from=deps --chown=node /code/node_modules ./node_modules
CMD [ "yarn", "dev" ]
