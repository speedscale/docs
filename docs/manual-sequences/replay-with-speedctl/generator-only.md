---
sidebar_position: 2
---

# Generator only

The generator is available as a docker container or a Kubernetes job. It will replay the traffic from your scenario against an application that you already have running. There are a few requirements:
* Id of the scenario that you want to replay
* Type of replay run (standard, performance, etc.)
* URL where the application is running

### Deploy the Generator in Kubernetes <a href="#deploy-the-generator-in-kubernetes" id="deploy-the-generator-in-kubernetes"></a>

The only pre-requisite is that you have **speedctl** on your machine, and a Kubernetes cluster to work with.

#### Running the Generator <a href="#running-the-generator" id="running-the-generator"></a>

Here is the command to deploy the generator job:

```
speedctl generator -s <scenarioid> \
    -t <testconfig> \
    -i <testreportid> \
    -u <url> | kubectl -n <namespace> apply -f -
```



Not that the **testreportid** must be unique for each run. You can use a simple utility like **uuidgen** to make a unique id for you on the fly. Note that If you are using standard [Kubernetes DNS](https://github.com/kubernetes/dns/blob/master/docs/specification.md) then the format of the URL is:

```
<proto>://<service>.<namespace>.svc.cluster.local
```

If you want to test this out on your cluster, first create a blank namespace with:

```
kubectl create namespace speedtest
```

And then try something similar to the following command:

```
speedctl generator -s b52927a0fb2d-4182-914d-495252e6b5fb \
    -t standard \
    -i $(uuidgen) \
    -u https://pricing.motoshop.svc.cluster.local | kubectl -n speedtest apply -f -
```

You should see output like so:

```
serviceaccount/ss-playback-sa created
role.rbac.authorization.k8s.io/ss-playback-metricrole created
rolebinding.rbac.authorization.k8s.io/ss-playback-metricrolebinding created
secret/gcrcred created
secret/awscreds created
secret/ss-certs created
deployment.apps/speedscale-redis created
service/speedscale-redis created
configmap/playback created
job.batch/speedscale-generator created
```

And of course you can fetch the logs

#### Cleaning up the Generator <a href="#cleaning-up-the-generator" id="cleaning-up-the-generator"></a>

When the job is complete and you want to clean everything up, you can do it like so:

```
speedctl generator -s <scenarioid> \
    -t <testconfig> \
    -i <testreportid> \
    -u <url> | kubectl -n <namespace> delete -f -
```

The expected output should look like so:

```
serviceaccount "ss-playback-sa" deleted
role.rbac.authorization.k8s.io "ss-playback-metricrole" deleted
rolebinding.rbac.authorization.k8s.io "ss-playback-metricrolebinding" deleted
secret "gcrcred" deleted
secret "awscreds" deleted
secret "ss-certs" deleted
deployment.apps "speedscale-redis" deleted
service "speedscale-redis" deleted
configmap "playback" deleted
job.batch "speedscale-generator" deleted
```
