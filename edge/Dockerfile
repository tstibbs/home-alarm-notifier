FROM node:14-buster-slim

# upgrade npm so it can handle the version of the lock files we produce
RUN npm install -g npm@8

RUN apt-get update && \
    apt-get -y install netcat && \
    apt-get -y install iputils-ping && \
	rm -r /var/lib/apt/lists/* && \
	apt-get clean

# copy in dependencies that aren't in npm
# in dev run `mkdir -p deps/cloud-core/edge && cp -r ../../../cloud-core/edge/iot deps/cloud-core/edge/iot` to get this in the right place
RUN mkdir -p /cloud-core/edge
COPY deps/cloud-core/edge/iot /cloud-core/edge

WORKDIR /cloud-core/edge/iot
RUN npm ci --only=production

WORKDIR /usr/src/app

COPY app/*.js* ./

RUN npm ci --only=production

CMD [ "node", "." ]
