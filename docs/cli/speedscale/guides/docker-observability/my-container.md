
# My Container

In this guide you will capture and inspect data from your application
container running in Docker.

In this guide you will capture data from your [docker](https://docs.docker.com) container.  Reference [supported architectures](../../#supported-architectures) for other capture modes.

`speedscale` runs your application inside docker and records a "snapshot" of your application traffic from the requests in and and out.

![](./my-app-containerized.drawio.png)

### Start the Proxy

Start capturing by specifying the container image and HTTP port.  This assumes your application is listening on port 8080.  Set your application details accordingly.

```
speedscale start capture --image $YOUR_DOCKER_IMAGE --port 4143:8080
```

### Capture

Now `speedscale` is serving your application on localhost port 8080. Generate some traffic by making requests. As an example, requests to your order service might look something like this.

```
curl -X POST http://localhost:4143/orders -d '{"customer_id":"1234", "amount": 123.45}'
{"order_id": 456} # response from your service
curl http://localhost:4143/orders/456
```

### Stop the Proxy

Stop recording and finalize the analysis.

```
speedscale stop capture
```

### Inspect

Now inspect the snapshot you just created.

```
speedscale inspect
```
