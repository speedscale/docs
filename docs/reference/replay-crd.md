---
sidebar_position: 15
---

# Custom Resource Definition

## Overview

The `TrafficReplay` CRD enables traffic replay functionality within Kubernetes clusters managed by the Speedscale operator. It allows users to replay captured API traffic against target workloads for testing and validation purposes.

## API Reference

- **Group**: `speedscale.com`
- **Version**: `v1`
- **Kind**: `TrafficReplay`
- **Plural**: `trafficreplays`
- **Singular**: `trafficreplay`
- **Short Names**: `replay`
- **Scope**: Namespaced

## Resource Structure

### TrafficReplay Spec

The `spec` field defines the desired state of a TrafficReplay resource.

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `snapshotID` | string | ID of the traffic snapshot for this TrafficReplay |
| `testConfigID` | string | ID of the replay configuration used by generator and responder |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `buildTag` | string | Links a unique tag, build hash, etc. to the generated traffic replay report |
| `cleanup` | enum | Cleanup mode: `inventory` (default), `all`, or `none` |
| `customURL` | string | Custom URL to send ALL traffic to (overrides workload-specific URLs) |
| `mode` | enum | Replay mode: `full-replay`, `responder-only`, or `generator-only` |
| `needsReport` | boolean | Indicates if replay needs a report even in mocks-only mode |
| `timeout` | string | Time to wait for replay test to finish |
| `ttlAfterReady` | string | TTL for TrafficReplay objects after completion |
| `secretRefs` | []LocalObjectReference | References to secrets containing authorization tokens |
| `workloads` | []Workload | Target workloads for the traffic replay |

### Workload Configuration

The `workloads` field allows targeting multiple Kubernetes workloads during replay.

#### Workload Fields

| Field | Type | Description |
|-------|------|-------------|
| `ref` | ObjectReference | Reference to target workload (Deployment, Service, etc.) |
| `customURI` | string | Custom URI target instead of workload (required if `ref` not specified) |
| `tests` | []string | Inbound traffic slice identifiers to target this workload |
| `mocks` | []string | Outbound traffic slice identifiers to mock for this workload |
| `routing` | enum | Traffic routing method: `hostalias` or `nat` |

#### ObjectReference Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Name of the referenced object (required) |
| `kind` | string | Kind of referenced object (defaults to "Deployment") |
| `namespace` | string | Namespace of referenced object (defaults to TrafficReplay namespace) |
| `apiVersion` | string | API version of referenced object |

### TrafficReplay Status

The `status` field shows the observed state of the TrafficReplay resource.

#### Status Fields

| Field | Type | Description |
|-------|------|-------------|
| `active` | boolean | Whether traffic replay is currently running |
| `conditions` | []Condition | Current conditions of the TrafficReplay |
| `startedTime` | time | When the traffic replay started |
| `initializedTime` | time | When the test environment was prepared |
| `finishedTime` | time | When the traffic replay finished |
| `reportID` | string | ID of the generated traffic replay report |
| `reportURL` | string | URL to the traffic replay report |
| `observedGeneration` | integer | Last observed generation |
| `reconcileFailures` | integer | Number of controller reconciliation failures |

## Examples

### Basic TrafficReplay

```yaml
apiVersion: speedscale.com/v1
kind: TrafficReplay
metadata:
  name: my-app-replay
  namespace: default
spec:
  snapshotID: "snapshot-123"
  testConfigID: "config-456"
  buildTag: "v1.2.3"
  timeout: "10m"
  workloads:
  - ref:
      name: my-app
      kind: Deployment
    tests:
    - "my-app:api.example.com:443"
    mocks:
    - "database.internal:5432"
```

### Multi-Workload Replay

```yaml
apiVersion: speedscale.com/v1
kind: TrafficReplay
metadata:
  name: microservices-replay
  namespace: production
spec:
  snapshotID: "snapshot-789"
  testConfigID: "config-101"
  mode: "full-replay"
  cleanup: "inventory"
  workloads:
  - ref:
      name: api-service
      kind: Deployment
    tests:
    - "api.example.com"
    mocks:
    - "database.internal"
  - ref:
      name: worker-service
      kind: Deployment
    tests:
    - "worker.internal"
    mocks:
    - "queue.internal"
```

### Custom URL Replay

```yaml
apiVersion: speedscale.com/v1
kind: TrafficReplay
metadata:
  name: external-replay
  namespace: testing
spec:
  snapshotID: "snapshot-999"
  testConfigID: "config-888"
  customURL: "https://staging.example.com"
  needsReport: true
  ttlAfterReady: "1h"
```

## kubectl Commands

### Create a TrafficReplay

```bash
kubectl apply -f trafficreplay.yaml
```

### List TrafficReplays

```bash
kubectl get trafficreplays
kubectl get replay  # using short name
```

### Get TrafficReplay Details

```bash
kubectl describe trafficreplay my-app-replay
```

### Watch TrafficReplay Status

```bash
kubectl get trafficreplay my-app-replay -w
```

### Delete TrafficReplay

```bash
kubectl delete trafficreplay my-app-replay
```

## Status Monitoring

The TrafficReplay resource provides several status indicators through `kubectl get`:

- **Active**: Shows if the replay is currently running
- **Mode**: The replay mode being used
- **Status**: Current status message from conditions
- **Age**: Time since the resource was created

Monitor replay progress using:

```bash
kubectl get trafficreplay -w
```

## Traffic Targeting

### Inbound Traffic (Tests)

Use the `tests` field to specify which inbound traffic slices a workload should receive:

- Exact match: `"my-service:api.example.com:8080"`
- Partial match: `"api.example.com"` (if unique)
- All traffic: `"*"`

### Outbound Traffic (Mocks)

Use the `mocks` field to specify which outbound dependencies to mock:

- Exact match: `"my-service:database.internal:5432"`
- Partial match: `"database.internal"` (if unique)
- All traffic: `"*"`

## Cleanup Modes

- **`inventory`** (default): Revert environment to pre-replay state
- **`all`**: Clean up all resources created during replay
- **`none`**: Leave resources in their post-replay state

## Best Practices

1. **Use descriptive names** for TrafficReplay resources
2. **Set appropriate timeouts** based on expected replay duration
3. **Configure TTL** to automatically clean up completed replays
4. **Use build tags** to correlate reports with code versions
5. **Monitor conditions** for replay status and troubleshooting
6. **Specify workload tests and mocks** explicitly for multi-workload scenarios