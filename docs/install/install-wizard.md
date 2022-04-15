
# Install Wizard

![gandalf](https://media.giphy.com/media/TcdpZwYDPlWXC/giphy.gif)

The fastest and most reliable way to install Speedscale components is using the `speedctl` install wizard.

```
kubectl create namespace/speedscale
speedctl install operator
```

Answer the wizard's questions to install the Speedscale Operator and instrument your service with Speedscale.

## Adding Image Pull Secrets

If you need custom image pull secrets (for example, if you're rehosting Speedscale images in a dedicated registry), you may provide one or more secret names with the `--imgpullsecrets` argument, and the secrets will be attached to the service account.

```
speectl install --imgpullsecrets my-secret1,my-secret2p
```
