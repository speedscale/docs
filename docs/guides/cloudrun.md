---
title: Working with Cloud Run
---

:::danger
This is not a natively supported workflow. Speedscale works best inside a Kubernetes cluster using the operator and this workaround is subject to change.
:::

## Prerequisites
1. [Speedctl is installed](../setup/install/cli.md)

## Working with Google Cloud Run

![Architecture](./cloudrun/arch.png)

In order to capture traffic from Cloud Run, we need to set up a few components shown in the diagram above.

### Create a cluster

We need to create a GKE cluster in order to run our proxy and forwarding components. Follow the prompts in the Google Cloud console to create a standard GKE cluster. Do not create an Autopilot cluster. All other standard settings should be fine. Cluster creation can take a few minutes and we need to wait till it's finished in order to deploy Speedscale components to it. Once it's done, setup `kubectl` access by running

```
gcloud container clusters get-credential <cluster-name> --region <region>
```


### Deploy Speedscale components

Now that the cluster is set up, deploy the needed components by applying the provided manifests. We'll need to modify the manifests with custom values from `~/.speedctl/config` First, replace the following values in:

* `speedscale-forwarder` configmap from `~/.speedctl/config`
  * `CLUSTER_NAME`
  * `SUB_TENANT_STREAM`
  * `TENANT_BUCKET`
  * `TENANT_ID`
  * `TENANT_NAME`
* `speedscale-apikey` secret
  * `SPEEDSCALE_API_KEY` with `echo -n <your-api-key> | base64`
* `goproxy` deployment env vars
  * `APP_LABEL`, `APP_POD_NAME`, `APP_POD_NAMESPACE` with your app name
  * `REVERSE_PROXY_HOST` with the full URL of your cloud run app

Then run
```
kubectl create ns speedscale
kubectl apply -f manifests/
```

Now you'll need the IP of the goproxy instance you just created which you can get by running
```
kubectl -n speedscale get svc goproxy
NAME      TYPE           CLUSTER-IP    EXTERNAL-IP      PORT(S)                         AGE
goproxy   LoadBalancer   10.84.6.133   35.222.2.222   4143:30886/TCP,4140:31256/TCP   22h
```

Grab the external IP (35.222.2.222 here). It may take some time to show up as a TCP Load Balancer is provisioned when you deploy the manifests.

### Create the Google secret

In order to establish TLS connections to our proxy, we'll need to add the TLS cert to our trust store. We'll use Google Secret Manager to do this.

```
gcloud secrets create speedscale-certs --replication-policy="automatic"
kubectl -n speedscale get secret speedscale-certs -o json | jq -r '.data["tls.crt"]' | base64 -D | gcloud secrets versions add speedscale-certs --data-file=-
```
This pulls the TLS cert from Kubernetes and creates the same secret in Google Secret Manager. It is now available for our Cloud Run app to use.

### Configure the Cloud Run app

Now that all our infrastructure is setup, we can modify our app to capture traffic. In Cloud Run, navigate to the app and in the YAML tab, hit edit. We're going to add the env variables and mount the secret we created in the above step. The `ports` and `resources` section are shown just to indicate the level of indentation needed for our settings. Make sure to replace the IP in proxy settings to the one we grabbed from the Kubernetes service above (the port will remain unchanged ie. `4140`).

```yaml
ports:
- name: http1
  containerPort: 8080
env:
- name: SSL_CERT_FILE
  value: /etc/ssl/speedscale/tls.crt
- name: HTTP_PROXY
  value: http://35.222.2.222:4140
- name: HTTPS_PROXY
  value: http://35.222.2.222:4140
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
volumeMounts:
- name: tls
  readOnly: true
  mountPath: /etc/ssl/speedscale
volumes:
- name: tls
  secret:
  secretName: speedscale-certs
  items:
  - key: latest
    path: tls.crt
```

The environment variables depend on the language of your app so refer to [http proxy settings](../setup/sidecar/sidecar-http-proxy.md#configuring-your-application-proxy-server) and [side car trust settings](../setup/sidecar/sidecar-trust.md).

### Verification

Now if you run `curl http://35.222.2.222:4143/<some path for your app>`, you should be able to access your Cloud Run app and also see the traffic in Speedscale.

## Future Enhancements
* Setting up a Load Balancer with HTTPS to route to our inbound goproxy.
