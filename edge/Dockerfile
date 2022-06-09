FROM node:14-buster-slim

# upgrade npm so it can handle the version of the lock files we produce
RUN npm install -g npm@8

RUN apt-get update && \
    apt-get -y install netcat && \
    apt-get -y install iputils-ping && \
	rm -r /var/lib/apt/lists/* && \
	apt-get clean

# copy in dependencies that aren't in npm, and set up the paths so it is where package json expects it to be
WORKDIR /usr/src/deps
COPY deps/cloud-core ./cloud-core
RUN mkdir -p /cloud-core/edge && \
    ln -s /usr/src/deps/cloud-core /cloud-core/edge/iot

WORKDIR /usr/src/deps/cloud-core
RUN npm ci --only=production

WORKDIR /usr/src/app

COPY app/*.js* ./

RUN npm ci --only=production

CMD [ "node", "." ]
