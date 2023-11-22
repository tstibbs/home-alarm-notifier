FROM node:20-bookworm-slim

ENV NPM_CONFIG_ENGINE_STRICT=true

RUN apt-get update && \
    apt-get -y install netcat-traditional && \
    apt-get -y install iputils-ping && \
	rm -r /var/lib/apt/lists/* && \
	apt-get clean

# copy in dependencies that aren't in npm
# in dev run `mkdir -p deps/cloud-core/edge && cp -r ../../cloud-core/edge/iot deps/cloud-core/edge/iot` to get this in the right place
RUN mkdir -p /cloud-core/edge/iot
WORKDIR /cloud-core/edge/iot
COPY deps/cloud-core/edge/iot/*.js* ./

RUN npm ci --omit=dev

WORKDIR /usr/src/app

COPY app/*.js* ./

RUN npm ci --omit=dev

CMD [ "node", "." ]

# example commands to deploy onto the device that will be running this
# (for dev it's probably simpler than pushing out a container image)
#
# ssh device mkdir -p ~/workspace/home-alarm-notifier/app ~/workspace/home-alarm-notifier/deps/cloud-core/edge/iot/ ~/workspace/home-alarm-notifier/creds
# cd edge
# scp -r app/*.js* device:~/workspace/home-alarm-notifier/app
# scp -r deps/cloud-core/edge/iot/*.js* device:~/workspace/home-alarm-notifier/deps/cloud-core/edge/iot/
# scp -r Dockerfile docker-compose.yml device:~/workspace/home-alarm-notifier/
# scp -r creds/* device:~/workspace/home-alarm-notifier/creds/
