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


### Replay locally 

See the full guild in [cli](/guides/cli.md#terminal-2-1) page.
