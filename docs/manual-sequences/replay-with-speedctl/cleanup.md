---
sidebar_position: 3
---

# Cleanup

Cleaning up components after a run

### Verify Generator Completed <a href="#verify-generator-completed" id="verify-generator-completed"></a>

First, before you start your cleanup process you want to check that generator ran all the way to completion. If you start the cleanup too quickly then you may leave a report **In Progress** and it will never complete. Verify with the following command:

```
kubectl -n sstest get jobs
```

The output should look something like this:

```
NAME                   COMPLETIONS   DURATION   AGE
generator-..........   1/1           13s        2m28s
```

### Re-Run Generator <a href="#re-run-generator" id="re-run-generator"></a>

Maybe you want to re-run that snapshot one more time before you clean up the environment. Perhaps you want to build another system under test container and test it again. There is a command just for that.

```
speedctl runtest | kubectl -n sstest apply -f -
```

Expected output is something like this:

```
job.batch/generator-0flm0ljdzb created
```

### Cleanup the Generator(s) <a href="#cleanup-the-generators" id="cleanup-the-generators"></a>

OK so you really want to clean up now, here's how to delete the generator jobs.

```
kubectl -n sstest delete jobs --all
```

Expected output is like so (1 line per job):

```
job.batch "generator-.........." deleted
```

### Cleanup the System Under Test <a href="#cleanup-the-system-under-test" id="cleanup-the-system-under-test"></a>

This one is still on you, but if you have a single yaml you can:

```
kubectl -n sstest delete -f front-end.yaml
```

Expected output:

```
service "front-end" deleted
deployment.apps "front-end" deleted
```

### Cleanup the Responders and Mock Services <a href="#cleanup-the-responders-and-mock-services" id="cleanup-the-responders-and-mock-services"></a>

This should be the last part of the cleanup.

```
speedctl responder -s <scenarioid> | kubectl -n sstest delete -f -
```

The output will depend upon how many mock services are part of your snapshot.

```
secret "gcrcred" deleted
secret "awscreds" deleted
service "redis" deleted
deployment.apps "redis" deleted
configmap "responder" deleted
service "responder" deleted
deployment.apps "responder" deleted
service "catalogue" deleted
service "carts" deleted
service "user" deleted
```

### (Optional) Delete the Namespace <a href="#optional-delete-the-namespace" id="optional-delete-the-namespace"></a>

If you want to get rid of the namespace that you used, then you can also delete that with the command:

```
kubectl delete namespace sstest
```

Expected output is:

```
namespace "sstest" deleted
```

You've cleaned up after yourself, well done!
