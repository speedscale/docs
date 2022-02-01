
# Manually Running Reverse Proxy Sidecar

This is useful if you want to collect data running outside of a Kubernetes
environment.

### Pre-Requisite: docker login credentials <a href="#pre-requisite-i-docker-login-credentials" id="pre-requisite-i-docker-login-credentials"></a>

You need to get a docker password JSON file from Speedscale. Then on your machine you run the following to register:

```
docker login -u _json_key --password-stdin https://gcr.io < gcrpull2.json
```

The expected output will be similar to this (note that **admin** is the user name in this case):

```
WARNING! Your password will be stored unencrypted in /home/admin/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded
```

### Pre-Requisite: forwarder.list <a href="#pre-requisite-ii-forwarderlist" id="pre-requisite-ii-forwarderlist"></a>

Download the file **forwarder.list**, and copy into a working directory on your Virtual Machine.

### Reverse Proxy Overview

Let's say you have a simple application with Clients that call an existing Virtual Machine.

![Before](https://dev.speedscale.com/img/reverse-proxy-before.png)

The Speedscale sidecar can be installed and configured as a reverse proxy. When installed in this mode, you also need to run a `forwarder` in your environment which will forward the captured traffic to the Speedscale service. You can install the goproxy on the same machine and migrate the ports around so that clients will continue to call the same endpoint. The goproxy will receive the call and proxy to the live backend.

![After](https://dev.speedscale.com/img/reverse-proxy-after.png)

### Running the Forwarder <a href="#running-the-forwarder" id="running-the-forwarder"></a>

When you run the forwarder, it will listen for connections from goproxy. The docker image listens on port 8888, but you can change the local port based on your requirements. This is how to run the docker image as well as publishing the port on the machine where you are running docker. Note that you will want to configure **CLUSTER\_NAME** with a value that makes sense for your environment.

```
docker run --detach --rm \
    --env CLUSTER_NAME=my_cluster \
    --env-file=forwarder.list \
    --publish 8888:8888/tcp \
    gcr.io/speedscale/forwarder:stable
```

You can see it is working with **docker ps**:

```
CONTAINER ID   IMAGE                                COMMAND                  CREATED       STATUS       PORTS                 
xxxxxxxxxxxx   gcr.io/speedscale/forwarder:stable   "/home/speedscale/fo…"   2 hours ago   Up 2 hours   0.0.0.0:8888->8888/tcp
```

You can confirm it is listening on your desired port 8888 with netstat:

```
netstat -an | grep 8888
```

Here is the expected output from netstat:tcp6 0 0 :::8888 :::\* LISTEN

### Running the Reverse Proxy Sidecar <a href="#running-the-reverse-proxy-sidecar" id="running-the-reverse-proxy-sidecar"></a>

Once the forwarder is running you can configure the reverse proxy sidecar. These are the required environment variables:

| Environment Variable | Description                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `PROXY_TYPE`         | Set to **reverse** to configure reverse proxy mode                                                                                  |
| `PROXY_IN_PORT`      | Set to the port where goproxy will listen. Note that you also want to add the `--publish` flag for this port in the docker command. |
| `REVERSE_PROXY_HOST` | Set to the hostname where goproxy should proxy the traffic                                                                          |
| `REVERSE_PROXY_PORT` | Set to the port where goproxy should proxy the traffic                                                                              |
| `APP_LABEL`          | Name of the application, use the same name for multiple app instances                                                               |
| `APP_POD_NAME`       | Unique id of the instance of the app (ex: server hostname)                                                                          |
| `FORWARDER_ADDR`     | Set to the hostname:port where forwarder is running                                                                                 |

When you put these all together you can run the docker command like so. Note that the docker container is running in its own network so it needs to be able to proxy the traffic to `REVERSE_PROXY_HOST`, if you set that to localhost it will try to forward inside its own container which is not what you want.

```
docker run --detach --rm \
    --env PROXY_TYPE=reverse \
    --env PROXY_IN_PORT=4143 \
    --env REVERSE_PROXY_HOST=$(hostname) \
    --env REVERSE_PROXY_PORT=5000 \
    --env APP_LABEL=my_application_name \
    --env APP_POD_NAME=$(hostname) \
    --env FORWARDER_ADDR=$(hostname):8888 \
    --publish 4143:4143/tcp \
    gcr.io/speedscale/goproxy:stable
```

You can see it is working with **docker ps**:

```
CONTAINER ID   IMAGE                                COMMAND                  CREATED         STATUS         PORTS                 
yyyyyyyyyyyy   gcr.io/speedscale/goproxy:stable     "/usr/local/bin/gopr…"   4 minutes ago   Up 4 minutes   0.0.0.0:4143->4143/tcp
```

You can confirm it is listening on your desired port 4143 with`netstat`:

```
netstat -an | grep 4143
```

Here is the expected output from `netstat`:

```
tcp6       0      0 :::4143                 :::*                    LISTEN
```

### View Data in Analyzer <a href="#view-data-in-analyzer" id="view-data-in-analyzer"></a>

Now that you have forwarder and goproxy installed, you want to generate traffic with your Client and ensure it is working correctly. As the data goes through the proxy, a copy of the request and response will be sent to the forwarder. You can see the data in the [Analyzer](https://app.speedscale.com/analyze).

### Troubleshooting <a href="#troubleshooting" id="troubleshooting"></a>

You can use **docker logs** to gather logs from the forwarder and the goproxy containers.

#### Logs from forwarder <a href="#logs-from-forwarder" id="logs-from-forwarder"></a>

Here is an example of the startup from the forwarder, note that the port should match the port you expect, and it should start the gRPC listener for registration coming from goproxy:

```
{"level":"info","msg":"SERVICE_PORT: 8888","time":"2020-12-13T14:18:30Z"}
{"level":"info","msg":"START Forwarder v0.2.1 compiled at 2020-11-23_09:11:19PM","time":"2020-12-13T14:18:30Z"}
{"level":"info","msg":"DLP is not configured, skipping","time":"2020-12-13T14:18:30Z"}
{"level":"info","msg":"Telemetry reporing turned off because interval is zero or app pod namespace is empty","time":"2020-12-13T14:18:30Z"}
{"level":"info","msg":"Starting reaper for proxies that haven't checked in after 45s","time":"2020-12-13T14:18:30Z"}
{"level":"info","msg":"Starting gRPC listener on port 0.0.0.0:8888","time":"2020-12-13T14:18:30Z"}
```

Later when a goproxy connects to the forwarder you should see a log like this:

```
{"level":"info","msg":"REGISTER proxy ID ip-192-168-3-149 at timestamp \u003cnil\u003e","time":"2020-12-13T14:25:03Z"}
```

#### Logs from goproxy <a href="#logs-from-goproxy" id="logs-from-goproxy"></a>

When the goproxy starts up these are some standard logs, it should try to immediately register with the forwarder:

```
{"info":"INFO","T":"2020-12-13T14:25:03.758Z","M":"START Speedscale Network Proxy","version":"v0.2.2","buildTime":"2020-12-01_06:37:32PM"}
{"info":"INFO","T":"2020-12-13T14:25:03.759Z","M":"Starting proxy listener","network":"tcp","addr":":4143"}
{"info":"INFO","T":"2020-12-13T14:25:03.763Z","M":"Successfully connected to forwarder","addr":"192.168.3.149:8888"}
{"info":"DEBUG","T":"2020-12-13T14:25:03.763Z","M":"Attempting to register with forwarder"}
{"info":"INFO","T":"2020-12-13T14:25:03.770Z","M":"Successfully registered with forwarder","proxyID":"ip-192-168-3-149"}
```

Also when you send traffic to the goproxy, it should be able to reverse proxy it successfully to the hostname you provided. This is a success (note DEBUG log level configured):

```
{"info":"DEBUG","T":"2020-12-13T14:28:56.590Z","M":"Connection established","remoteAddr":"172.17.0.1:46450","directAddr":"192.168.3.149:5000","cid":0}
{"info":"DEBUG","T":"2020-12-13T14:28:56.594Z","M":"CheckProtocol duration","remoteAddr":"172.17.0.1:46450","directAddr":"192.168.3.149:5000","cid":0,"duration":"114ns"}
{"info":"DEBUG","T":"2020-12-13T14:28:56.594Z","M":"Detected protocol","remoteAddr":"172.17.0.1:46450","directAddr":"192.168.3.149:5000","cid":0,"protocol":"HTTP"}
{"info":"DEBUG","T":"2020-12-13T14:28:56.594Z","M":"ProxyAndDecode setup duration","remoteAddr":"172.17.0.1:46450","directAddr":"192.168.3.149:5000","cid":0,"duration":"3.538369ms"}
{"info":"DEBUG","T":"2020-12-13T14:28:56.594Z","M":"HTTP REQUEST","remoteAddr":"172.17.0.1:46450","directAddr":"192.168.3.149:5000","cid":0,"sequenceNum":0,"url":"/product"}
{"info":"DEBUG","T":"2020-12-13T14:28:56.596Z","M":"HTTP RESPONSE","remoteAddr":"172.17.0.1:46450","directAddr":"192.168.3.149:5000","cid":0,"sequenceNum":0,"responseLength":14}
```

This is an example of an error, the goproxy docker container is unable to forward to localhost because it's running in it's own network. Use the network name or ip address of the reverse proxy host instead:

```
{"info":"ERROR","T":"2020-12-13T14:30:40.549Z","M":"dial() ERR could not connect","addr":"127.0.0.1:5000","error":"dial tcp 127.0.0.1:5000: connect: connection refused"}
{"info":"ERROR","T":"2020-12-13T14:30:40.549Z","M":"DIRECT|172.17.0.1:46462...localhost:5000|Could not connect, giving up","error":"dial tcp 127.0.0.1:5000: connect: connection refused"}
```
