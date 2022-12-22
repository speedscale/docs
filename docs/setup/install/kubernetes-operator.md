---
sidebar_position: 1
---
# Kubernetes Operator

The operator acts like a SRE inside your own cluster, properly deploying and
configuring the various Speedscale components.

The Speedscale Kubernetes Operator works similarly to a service mesh controller
like Istio or Linkerd. It waits for deployments to be applied to the cluster
that contain specific annotations. It then automatically stands up an isolation
test environment around the deployment. The operator itself is a deployment
that will be always present on the cluster.

## Install with Helm

Helm is familiar to many devs and SREs.  Reference the
[Speedscale Helm repository](https://github.com/speedscale/operator-helm) for further instructions.

## Install with Speedctl CLI Wizard

![gandalf](https://media.giphy.com/media/TcdpZwYDPlWXC/giphy.gif)

Speedscale components may also be installed using the `speedctl` install wizard.

```
kubectl create namespace speedscale
speedctl install operator
```

Answer the wizard's questions to install the Speedscale Operator and instrument your service with Speedscale.

### Adding Image Pull Secrets

If you need custom image pull secrets (for example, if you're re-hosting
Speedscale images in a dedicated registry), you may provide one or more secret
names with the `--imgpullsecrets` argument, and the secrets will be attached to
the service account.

```
speectl install --imgpullsecrets my-secret1,my-secret2p
```

