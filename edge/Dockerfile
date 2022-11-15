FROM node:16-buster-slim

ENV NPM_CONFIG_ENGINE_STRICT=true

RUN apt-get update && \
    apt-get -y install netcat && \
    apt-get -y install iputils-ping && \
	rm -r /var/lib/apt/lists/* && \
	apt-get clean

# copy in dependencies that aren't in npm
# in dev run `mkdir -p deps/cloud-core/edge && cp -r ../../cloud-core/edge/iot deps/cloud-core/edge/iot` to get this in the right place
RUN mkdir -p /cloud-core/edge
COPY deps/cloud-core/edge/iot /cloud-core/edge

WORKDIR /cloud-core/edge/iot
RUN npm ci --omit=dev

WORKDIR /usr/src/app

COPY app/*.js* ./

RUN npm ci --omit=dev

CMD [ "node", "." ]
