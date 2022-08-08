---
sidebar_position: 1
---
# Kubernetes Operator

The operator acts like a SRE inside your own cluster, properly deploying and
configuring the various Speedscale components.

The Speedscale Kubernetes Operator works similarly to a service mesh controller like Istio or Linkerd. It waits for deployments to be applied to the cluster that contain specific annotations. It then automatically stands up an isolation test environment around the deployment. The operator itself is a deployment that will be always present on the cluster.

## Install Wizard

![gandalf](https://media.giphy.com/media/TcdpZwYDPlWXC/giphy.gif)

The fastest and most reliable way to install Speedscale components is using the `speedctl` install wizard.

```
kubectl create namespace speedscale
speedctl install operator
```

Answer the wizard's questions to install the Speedscale Operator and instrument your service with Speedscale.

### Adding Image Pull Secrets

If you need custom image pull secrets (for example, if you're rehosting Speedscale images in a dedicated registry), you may provide one or more secret names with the `--imgpullsecrets` argument, and the secrets will be attached to the service account.

```
speectl install --imgpullsecrets my-secret1,my-secret2p
```

## Uninstall Operator <a href="#uninstall-operator" id="uninstall-operator"></a>

Before you uninstall the operator, make sure that you have uninjected the sidecar from your pods.

To uninstall the Speedscale Operator, run the following command:

```
speedctl deploy operator | kubectl delete -f -
```
or
```
helm install speedscale-operator
```
then
```
kubectl delete namespace/speedscale
```

This command must be run to properly delete the Operator.
