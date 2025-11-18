---
sidebar_position: 9
---

# Replay With `speedctl`

`speedctl` gives you the options of running a replay locally or against deployment in a cluster. 

### Replay in a Cluster
Either it's a the same cluster that you caputured the traffic or it's another cluster, you need to have an active [inspector](/reference/glossary.md#inspector) in your cluster. 
By running: 
```
speedctl infra replay {workload_name} --snapshot-id {snapshot_id} --cluster {cluster_name}
```
It will run a replay agains your workload in the specified cluster. To see more details run `speedctl infra replay --help`.

Additionally, cluster replays can be initiated in a way that maps requests to be sent to specific targets. For
example, a snapshot containing traffic that will be replayed to services A, B, and C can have some or all of
that traffic sent to a different endpoint. This might be useful in instances where all three services need to
be tested as one collective unit, but you are interested in testing the entire sub-system when sending traffic
to a newer version of one of the services. For these cases, you can use the `--test-against` flag:

```
speedctl infra replay --test-against original:80=new-service:8888 --snapshot-id {snapshot_id} --cluster {cluster_name}
```

Note: using this flag is mutually exclusive from specifying `{workload_name}`.

### Replay locally 

See the full guild in [cli](/guides/cli.md#terminal-2-1) page.
