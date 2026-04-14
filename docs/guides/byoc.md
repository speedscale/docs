---
title: Bring Your Own Cloud
description: "Send data to your own cloud via an otel log exporter"
---

# Bring Your Own Cloud

:::danger

This is an enterprise only feature that must be enabled by the Speedscale team and will not work out of the box.

:::

In this guide we'll show you how to set up exporters for Speedscale RRPair data via OpenTelemetry logs. For this guide, we'll setup [FluentBit](https://fluentbit.io) as our OTel collector but you can use any collector you choose that supports log collection.

## Architecture

```mermaid
graph TD
    goproxy -->|data| forwarder
    forwarder --> speedscale[Speedscale Cloud]
    forwarder --> collector[OTel Log Collector]
    collector --> output

    output@{ shape: processes, label: "Destinations" }

```

## Step 0: Setup your collector (optional)

For our setup, we are going to configure FluentBit to accept OpenTelemetry logs (on default port 4318) and output them to stdout as well as S3

```yaml
extraPorts:
  - name: otel
    port: 4318
    containerPort: 4318
    protocol: TCP
config:
  inputs: |
    [INPUT]
        Name opentelemetry
  outputs: |
    [OUTPUT]
        Name   stdout
        Match  *
    [OUTPUT]
        Name                         s3
        Match                        *
        Bucket                       my-bucket
        Region                       us-west-2
        Total_File_Size              250M
        S3_Key_Format                /%Y/%m/%d/%H/%M/%S/$UUID.gz
        S3_Key_Format_Tag_Delimiters .-
```

We use this `values.yaml` in our FluentBit installation via Helm.

```bash
 helm upgrade --install fluent-bit oci://ghcr.io/fluent/helm-charts/fluent-bit -f values.yaml
```

## Step 1: Configure the Speedscale Helm chart

Along with our other settings, we add an `exporters` section, which is a map of exporter names to exporter configs, to the `forwarder` section of our `values.yaml`.

From our above collector installation where we installed FluentBit without a namespace (default) and with port 4318, we configure an exporter named `everything`.

```yaml
forwarder:
  exporters:
    everything:
      otel_endpoint: http://fluent-bit.default.svc.cluster.local:4318
      filter_rule: standard
      dlp_config_id: ""
```

## Step 2: Verify the output

In your final output destination, verify that data is being forwarded. In our example we can verify by tailing fluent logs (because we configured stdout as an output) or by looking for files in S3 that should contain OTel logs wrapping RRPair data.

For eg.

```
[1776173034.826199386, {"direction":"OUT","service":"java-client","tech":"JSON","msgType":"rrpair","resource":"java-client","uuid":"oJlIjhkLQM+if1ychK7GxA==","cluster":"cluster","status":"200","http":{"res":{"bodyBase64":"eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlKOS5leUpwYzNNaU9pSnFZWFpoTFhObGNuWmxjaUlzSW5OMVlpSTZJbUZrYldsdUlpd2lZWFZrSWpvaWMzQmhZMlY0TFdaaGJuTWlMQ0pwWVhRaU9qRTNOell4TnpNd016UXNJbVY0Y0NJNk1UYzNOakkxT1RRek5Dd2libUptSWpveE56YzJNVFk1TkRNMGZRLmZDck9VcXNaUGhnZ1hPQTlwNlI2WUJtenV1aU5zZ2JCS2M1TUtVdWJEdHMiLCJleHBpcmVzX2lkIjoiODY0MDAwMDAiLCJ0b2tlbl90eXBlIjoiQmVhcmVyIn0=","contentType":"application/json","statusCode":200.0,"statusMessage":"200 ","headers":{"X-Content-Type-Options":["nosniff"],"X-Frame-Options":["DENY"],"X-Xss-Protection":["0"],"Cache-Control":["no-cache, no-store, max-age=0, must-revalidate"],"Content-Type":["application/json"],"Date":["Tue, 14 Apr 2026 13:23:54 GMT"],"Expires":["0"],"Pragma":["no-cache"]}},"req":{"url":"/login","uri":"/login","version":"1.1","method":"POST","host":"java-server","headers":{"User-Agent":["curl/8.17.0"],"Accept":["*/*"],"Content-Length":["42"],"Content-Type":["application/json"],"Host":["java-server"]},"bodyBase64":"eyJ1c2VybmFtZSI6ICJhZG1pbiIsICJwYXNzd29yZCI6ICJwYXNzIiB9"}},"session":"eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqYXZhLXNlcnZlciIsInN1YiI6ImFkbWluIiwiYXVkIjoic3BhY2V4LWZhbnMiLCJpYXQiOjE3NzYxNzMwMzQsImV4cCI6MTc3NjI1OTQzNCwibmJmIjoxNzc2MTY5NDM0fQ.fCrOUqsZPhggXOA9p6R6YBmzuuiNsgbBKc5MKUubDts","ts":"2026-04-14T13:23:54.826199386Z","namespace":"speedscale","location":"/login","netinfo":{"id":"1","startTime":"2026-04-14T13:23:54.826010969Z","downstream":{"established":"2026-04-14T13:23:54.825380677Z","ipAddress":"10.244.1.206","port":39750.0,"bytesSent":"175"},"upstream":{"established":"2026-04-14T13:23:54.825883386Z","ipAddress":"10.99.78.6","port":80.0,"hostname":"java-server","bytesSent":"568"}},"l7protocol":"http","duration":5.0,"tags":{"proxyLocation":"out","proxyVersion":"v2.5.436","source":"goproxy","captureMode":"proxy","k8sAppLabel":"java-client","proxyId":"java-client-7c8878c48d-4dnr6","proxyProtocol":"","proxyType":"transparent","sequence":"2","k8sAppPodName":"java-client-7c8878c48d-4dnr6","k8sAppPodNamespace":"speedscale"},"command":"POST","signature":{"http:method":"UE9TVA==","http:queryparams":"","http:requestBodyJSON":"eyJwYXNzd29yZCI6InBhc3MiLCJ1c2VybmFtZSI6ImFkbWluIn0=","http:url":"L2xvZ2lu","http:host":"amF2YS1zZXJ2ZXI="}}]
```
