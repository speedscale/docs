import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Docker

Do you run your apps locally in Docker containers? **proxymock** works great with local containers, with a bit of configuration.

Choose your adventure below.

## Docker Run

Run **proxymock** locally while your app runs in a container.

<Tabs>
<TabItem value="record" label="Record">

1. Start by running **proxymock**:

```shell
proxymock record --app-port 8080
```

2. Pass proxy environment variables to your container when you run it:

```shell
docker run \
  -e http_proxy=http://host.docker.internal:4140 \
  -e https_proxy=http://host.docker.internal:4140 \
  your-app:tag \
  -p 8080:8080
```

Requests made to local port `4143` will be recorded as [inbound traffic](/reference/glossary.md#traffic) and forwarded to local port `8080`, assuming your app listens on port `8080` like our example here.  Requests from your app will be forwarded through **proxymock** and recorded as [outbound traffic](/reference/glossary.md#traffic).

</TabItem>
<TabItem value="mock" label="Mock">

1. Start by running **proxymock**:

```shell
proxymock mock --in ./proxymock
```

2. Pass proxy environment variables to your container when you run it:

```shell
docker run \
  -e http_proxy=http://host.docker.internal:4140 \
  -e https_proxy=http://host.docker.internal:4140 \
  your-app:tag
```

Requests from your app will be sent to **proxymock** and either mocked or passed through to the real resouce if they don't match.  See [signature matching](/proxymock/how-it-works/signature/) for more information.

</TabItem>
<TabItem value="replay" label="Replay">

1. Pass proxy environment variables to your container when you run it:

```shell
docker run \
  -e http_proxy=http://host.docker.internal:4140 \
  -e https_proxy=http://host.docker.internal:4140 \
  your-app:tag \
  -p 8080:8080
```

2. Once your app is running, start **proxymock**:

```shell
proxymock replay --in ./proxymock --test-against http://localhost:8080
```

The [RRPair](/reference/glossary.md#rrpair) files from the `--in` directory will be replayed in order against the URL from `--test-against`.

</TabItem>
</Tabs>

## Docker Compose

For complex setups with multiple services, run **proxymock** alongside your application containers using [Docker Compose](https://docs.docker.com/compose/).

<Tabs>
<TabItem value="record" label="Record">

1. Create or modify your `docker-compose.yaml` file:

```yaml
networks:
  # put all services on the same network
  proxymock-net:
    driver: bridge

services:
  # proxymock app container
  proxymock:
    image: gcr.io/speedscale/proxymock:latest
    command:
      - record
      # inbound requests to proxymock port 4143 will be recorded and forwarded to this port
      - --app-port
      - "8080"
      # inbound requests to proxymock port 4143 will be recorded and forwarded to this host
      - --app-host
      - "app"
      # uncomment for verbose logging
      #- -vv
    ports:
      # expose inbound port so you can capture inbound traffic by making requests to this port directly
      - "4143:4143"
      # expose outbound proxy port in case you need to record apps outside of docker
      - "4140:4140"
    volumes:
      # ensure recorded traffic ends up in a local directory
      - ./proxymock:/proxymock
      # mount Speedscale config for credentials
      - ~/.speedscale/config.yaml:/home/speedscale/.speedscale/config.yaml:ro
      # mount certs directory for TLS
      - ~/.speedscale/certs:/home/speedscale/.speedscale/certs:ro
    networks:
      - proxymock-net
    environment:
      SPEEDSCALE_HOME: /home/speedscale/.speedscale

  # your app container
  app:
    environment:
      - http_proxy=http://proxymock:4140
      - https_proxy=http://proxymock:4140
      # trust the proxymock certificate for HTTPS traffic
      - SSL_CERT_FILE=/certs/tls.crt
    volumes:
      # mount certs from local Speedscale dir
      - ~/.speedscale/certs:/certs:ro
    depends_on:
      - proxymock
    networks:
      - proxymock-net
    ############################################################
    ### everything below is YOUR app-specific configuration! ###
    ###            image, ports, volumes, etc.               ###
    ############################################################
    image: your-app:image
    ports:
      - "8080:8080"
```

2. Run `docker compose up` to start the containers.

3. Make requests to your app.

Requests made to local port `4143` will be recorded as [inbound traffic](/reference/glossary.md#traffic) and forwarded to local port `8080`, assuming your app listens on port `8080` like our example here.  Requests from your app will be forwarded through **proxymock** and recorded as [outbound traffic](/reference/glossary.md#traffic). Recorded traffic will be written to the local `./proxymock` directory.

</TabItem>
<TabItem value="mock" label="Mock">

1. Create or modify your `docker-compose.yaml` file:

```yaml
networks:
  # put all services on the same network
  proxymock-net:
    driver: bridge

services:
  # proxymock app container
  proxymock:
    image: gcr.io/speedscale/proxymock:latest
    command:
      - mock
      - --in
      # read mock RRPair files from this directory
      - /proxymock
      # uncomment for verbose logging
      #- -vv
    ports:
      # expose outbound proxy port in case you need to mock apps outside of docker
      - "4140:4140"
    volumes:
      # map local proxymock directory containing RRPair files
      - ./proxymock:/proxymock
      # mount Speedscale config for credentials
      - ~/.speedscale/config.yaml:/home/speedscale/.speedscale/config.yaml:ro
      # mount certs directory for TLS
      - ~/.speedscale/certs:/home/speedscale/.speedscale/certs:ro
    networks:
      - proxymock-net
    environment:
      SPEEDSCALE_HOME: /home/speedscale/.speedscale

  # your app container
  app:
    environment:
      - http_proxy=http://proxymock:4140
      - https_proxy=http://proxymock:4140
      # trust the proxymock certificate for HTTPS traffic
      - SSL_CERT_FILE=/certs/tls.crt
    volumes:
      # mount certs from local Speedscale dir
      - ~/.speedscale/certs:/certs:ro
    depends_on:
      - proxymock
    networks:
      - proxymock-net
    ############################################################
    ### everything below is YOUR app-specific configuration! ###
    ###            image, ports, volumes, etc.               ###
    ############################################################
    image: your-app:image
    ports:
      - "8080:8080"
```

2. Run `docker compose up` to start the containers.

3. Make requests to your app.

Requests from your app will be sent to **proxymock** and either mocked or passed through to the real resource if they don't match. See [signature matching](/proxymock/how-it-works/signature/) for more information.  Any created files will be written to `./proxymock`.

</TabItem>
<TabItem value="replay" label="Replay">

1. Create or modify your `docker-compose.yaml` file:

:::note
The **proxymock** container will start replaying traffic as soon as it launches. See where the **proxymock** service depends on your app and ensure your app is fully initialized before starting the **proxymock** service, which may require health checks and startup delays.
:::

```yaml
networks:
  # put all services on the same network
  proxymock-net:
    driver: bridge

services:
  # proxymock app container
  proxymock:
    image: gcr.io/speedscale/proxymock:latest
    command:
      - replay
      # read RRPair files from this directory
      - --in
      - /proxymock
      # target the app container
      - --test-against
      - http://app:8080
      # uncomment for verbose logging
      #- -vv
    volumes:
      # map local proxymock directory containing RRPair files
      - ./proxymock:/proxymock
      # mount Speedscale config for credentials
      - ~/.speedscale/config.yaml:/home/speedscale/.speedscale/config.yaml:ro
      # mount certs directory for TLS
      - ~/.speedscale/certs:/home/speedscale/.speedscale/certs:ro
    networks:
      - proxymock-net
    environment:
      SPEEDSCALE_HOME: /home/speedscale/.speedscale
    depends_on:
      # proxymock needs to start AFTER your app
      - app

  # your app container
  app:
    environment:
      # trust the proxymock certificate for HTTPS traffic
      - SSL_CERT_FILE=/certs/tls.crt
    volumes:
      # mount certs from local Speedscale dir
      - ~/.speedscale/certs:/certs:ro
    networks:
      - proxymock-net
    ############################################################
    ### everything below is YOUR app-specific configuration! ###
    ###            image, ports, volumes, etc.               ###
    ############################################################
    image: your-app:image
    ports:
      - "8080:8080"
```

2. Run `docker compose up` to start the containers.

The [RRPair](/reference/glossary.md#rrpair) files from the `./proxymock` directory will be replayed against the app container, and any created files will be written to `./proxymock`.

</TabItem>
</Tabs>


