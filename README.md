# karmen-octoprint-connector

Connect your OctoPrint box to the Karmen cloud service! This package allows
you to connect your box easily.

It is intended to be installed alongside your OctoPrint server, **on the same
machine**. It provides features required by Karmen cloud in terms of networking:
it implements a websocket-proxy client that creates a safe websocket tunnel to
the Karmen cloud which in turns makes it possible for Karmen to monitor and
manage your OctoPrint box remotely. That saves you from headaches when setting
up proper networking to make things safe from the outside.

Linking your box is fairly simple, the outline is as follows:

1. Generate your connection key - you will use this key to register your box in Karmen in the last step
2. Spawn a websocket tunnel - this will open the connection to the Karmen cloud
3. [Sign up](https://karmen.tech/register) for Karmen
4. Log in and add your printer using the connection key from the first step as the device token

## Running using Docker

In case you don't have NPM installed, using Docker is probably the easiest option.

```
# Generate your connection key and store it
karmen_key=$(docker run fragaria/karmen-octoprint-connector:latest generate-key --raw)

# Open the tunnel
docker run --init fragaria/karmen-octoprint-connector:latest connect $karmen_key
```

## Using npx

If you have NPM installed, using npx can't get any easier:

```
# Generate your connection key and store it
karmen_key=$(npx karmen-octoprint-connector generate-key --raw)

# Open the tunnel
npx karmen-octoprint-connector connect $karmen_key
```

## Running as systemd service

For production use, we recommend running the octoprint connector in more
resilient fashion as a systemd service. There is an example [systemd service
config](./karmen-octoprint-connector.service) as well as [environment
file](./karmen-octoprint-connector.conf) you can use.

Save the service config file to
`/etc/systemd/system/karmen-octoprint-connector.service`. Save the environment
file to `/etc/karmen-octoprint-connector.conf` and modify it according to your
needs: **don't forget to specify your connection key**. Finally load the service:

```
sudo systemctl daemon-reload
sudo systemctl start karmen-octoprint-connector.service
```

You're good to go!

## License

All of the code herein is copyright 2020 Fragaria s.r.o. and released under the
terms of the GNU Affero General Public License, version 3.
