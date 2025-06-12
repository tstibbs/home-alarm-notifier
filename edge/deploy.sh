#!/bin/bash

set -euo pipefail

gitCommit=$(git rev-parse HEAD)
if [ -n "$(git status -s)" ]
then
	gitCommit="$gitCommit+"
fi

ssh $device mkdir -p ~/workspace/home-alarm-notifier/app
scp -r app/package*.json $device:~/workspace/home-alarm-notifier/app
scp -r app/*.js $device:~/workspace/home-alarm-notifier/app/
ssh $device mkdir -p ~/workspace/home-alarm-notifier/deps/cloud-core/edge/iot/
scp -r deps/cloud-core/edge/iot/*.js* $device:~/workspace/home-alarm-notifier/deps/cloud-core/edge/iot/
scp -r Dockerfile docker-compose.yml $device:~/workspace/home-alarm-notifier/
echo "=================="
echo "Run the following:"
echo "cd ~/workspace/home-alarm-notifier/"
echo "docker tag \$(docker compose images -q app) home-alarm-notifier:last-working"
echo "export commit=$gitCommit && docker compose build"
echo "(optional) vim .env"
echo "(optional) populate 'creds' directory"
echo "docker compose down && docker compose up -d && docker compose logs --follow --timestamps"
echo "=================="
ssh $device
