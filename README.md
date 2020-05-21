# karmen-octoprint-connector

Connect your OctoPrint box to the Karmen cloud service! This package allows you
to connect your box easily.

It is intended to be installed alongside your OctoPrint server, **on the same
machine**. It provides features required by Karmen cloud in terms of networking:
it implements a websocket-proxy client that creates a safe websocket tunnel to
the Karmen cloud which in turns makes it possible for Karmen to monitor and
manage your OctoPrint box remotely. That saves you from headaches when setting
up proper networking to make things safe from the outside.

Linking your box is fairly simple, the outline is as follows:

1. [Sign up](https://cloud.karmen.tech/register) for Karmen
2. Log in and add a new printer with *Other device* option - you will be granted with a connection key
3. Spawn a websocket tunnel - this will open the connection to the Karmen cloud, use the connection from previous step to authenticate

## Running using Docker

In case you don't have NPM installed, using Docker is probably the easiest
option.

```
karmen_connection_key="your key"

# Open the tunnel
docker run --init --net=host fragaria/karmen-octoprint-connector:latest connect $karmen_connection_key
```

## Using npx

If you have NPM installed, using npx can't get any easier:

```
karmen_connection_key="your key"

# Open the tunnel
npx karmen-octoprint-connector connect $karmen_connection_key
```

## Running as systemd service

For production use, we recommend running the octoprint connector in more
resilient fashion as a systemd service. There is an example [systemd service
config](./karmen-octoprint-connector.service) for
[OctoPi](https://github.com/guysoft/OctoPi) as well as [environment
file](./karmen-octoprint-connector.conf) you can use. This setup assumes you
have Docker engine installed. In case you're wondering how to install it, you
can do so using following set of commands assuming you're on a Debian-based
system such as [OctoPi](https://github.com/guysoft/OctoPi):

```
# Install docker
sudo apt install software-properties-common -y
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# Allow pi default user to manage docker
sudo usermod -aG docker pi

# Reboot
sudo reboot
docker info # should print out some docker engine information
```

Save the service config file to
`/etc/systemd/system/karmen-octoprint-connector.service`. Save the environment
file to `/etc/karmen-octoprint-connector.conf` and modify it according to your
needs: **don't forget to specify your connection key**. Finally load the
service:

```
sudo systemctl daemon-reload
sudo systemctl start karmen-octoprint-connector.service
```

You're good to go!

## Development

This is just a simple node.js utility. Workflow is as usual:

```
npm i
```

Probably the hardest part is building the Docker image. Since this tool could be deployed to various architectures, multi-arch build is preferred. Make sure you have Docker with `buildx` support baked in. Then run:

```
export DOCKER_CLI_EXPERIMENTAL=enabled
```

And then trigger the multiarch build:

```
docker buildx build -t fragaria/karmen-octoprint-connector:latest . --platform=linux/amd64,linux/arm64,linux/arm/v7 --push
```

## License

All of the code herein is copyright 2020 Fragaria s.r.o. and released under the
terms of the GNU Affero General Public License, version 3.
