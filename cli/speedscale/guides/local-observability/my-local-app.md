---
description: >-
  In this guide you will capture and inspect data from your application running
  locally.
---

# My Local App

This guide assumes your application is running on localhost and listening on port 8080.  Modify commands accordingly.

`speedscale` will run a proxy that sits in between your HTTP client (cURL in this case) and your application.  Requests made to the proxy are forwarded to your app.

![](<../../../../.gitbook/assets/my-app-container.drawio (3).png>)

### Start the Proxy

Start capturing by specifying your application's HTTP port.  This assumes your application is listening on port 8080.

```
speedscale start capture -p 8080
```

Now `speedscale` will forward all requests made to proxy port 4143 to your application on port 8080.&#x20;

### Add TLS Cert (Optional)

You may be prompted to trust a newly generated certificate to support TLS.  This is required so the proxy can capture TLS traffic made to external systems.  We recommend trusting the certificate but if your application is not making TLS requests this step is not necessary.

### Configure SOCKS Proxy (Optional)

One drawback of proxy mode is that by default only inbound requests made to your application will be captured.  By setting some environment variables we can redirect outbound requests through the proxy as well, enabling more visibility.

![](../../../../.gitbook/assets/proxy-socks.drawio.png)

Set the HTTP proxy environment variables and restart your application.

```
export http_proxy=socks5://127.0.0.1:4140
export https_proxy=socks5://127.0.0.1:4140
./my_app
```

Note that these environment variables are not magical.  Your application, or more likely the networking library your application or language is using, needs to support these variables for this to work, otherwise these settings will be ignored. Some libraries may support these, but only for uppercase names `HTTP_PROXY` and `HTTPS_PROXY`.

### Capture

Generate some traffic by making requests to the proxy on port 4143. As an example, requests to your order service might look something like this.

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
