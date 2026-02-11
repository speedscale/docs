---
title: Performance and Diagnostics
sidebar_position: 4
---

## Performance and Latency

The sidecar proxy can add latency and impact performance in the same way an Envoy or nginx proxy can. The
exact impact of the proxy will vary based upon your workload and conditions. For that reason, we recommend
testing the sidecar in pre-production and then using a progressive rollout strategy in production. Due to high
variability, Speedscale does not currently publish benchmarks.

### Testing sidecar latency in pre-production

We recommend testing latency and overhead on a pre-production workload using this procedure:
1. Add monitoring for CPU and memory to your service. Just watching a tool like [k9s](https://k9scli.io/) and is sometimes sufficient. If you want to get fancy you use other tools like [ContainIQ](https://www.containiq.com/) or [Pixie](https://github.com/pixie-io/pixie).
2. Establish a baseline by running a consistent workload like a load test. Using Speedscale to replay and scale up volume is a great idea but you can also use existing load testing scripts.
3. Record the CPU, memory usage and **average latency** over the course of the load test.
4. Install the Speedscale sidecar
5. Re-run the same load test.
6. Compare results.

Even without changing anything it is unlikely that the CPU, memory and latency measurements will be the same
between load tests. Results tend to be variable even in a system that appears static. However, this procedure
will give you a rough idea whether the sidecar has a large impact.

### Progressive rollout

We recommend using a standard progressive rollout methodology in production. This procedure will vary greatly
depending on your deployment strategy. Generally, it is advisable install the sidecar on a single pod and
slowly expand to other pods after verifying the health of the application. You should avoid applying the
sidecar to your entire deployemnt at once.

## Diagnostics and Troubleshooting

### Packet Capture and Log Diagnostics

The sidecar includes a diagnostics operation mode that can be enabled if necessary. This mode does a few
things that provide additional data for support purposes, notably:

1. Increases logging verbosity to show more detail on the sidecar's inner workings.
2. Enablees packet captures for all known interfaces in the container.

To enable this mode, turn on diagnostics mode in the UI from Infrastructure -> Select Cluster -> Workloads -> Select Namespace -> Select Workload and turn the Enable Diagnostics Mode slider on.

![Diagnostics Screenshot](./diagnostics_screenshot.png)

Diagnostics will be automatically uploaded to Speedscale and no further action is necessary.

:::tip
Remember to turn off diagnostics mode after reproducing any issues by reversing this process or you will use ingest unnecessarily.
:::

If you would like to turn on diagnostics and collect PCAPs manually add the following annotation to any workload that already has the sidecar injected. This process is not necessary if remote control is enabled:

```
sidecar.speedscale.com/diagnostics: "true"
```

This will cause the workload to restart with the new settings enabled.

Diagnostic mode PCAPs are all written into the `/diagnostics` directory in the `speedscale-goproxy` container. Each
PCAP is named like `goproxy-capture.<IFACE>.pcap` where `<IFACE>` is the name of the network interface
captured. Most installations will have the following captures:

- `goproxy-capture.eth0.pcap` - all inbound/outbound pod traffic
- `goproxy-capture.lo.pcap` - all traffic observed on the pod’s loopback interface
- `goproxy-capture.dns0.pcap` - all DNS A record responses observed by the “smartdns” feature

There will also be a file named `keylog` written that can be used to decrypt TLS traffic if viewing one of
these captures in Wireshark.

To retrieve these files from the running container, you can use `kubectl cp`:

```
kubectl cp -n <NAMESPACE> -c speedscale-goproxy <POD_NAME>:/diagnostics .
```

### Proxy Diagnostics API

In addition to the above diagnostics mode, the proxy sidecar exposes a local-only API that provides details
about active and recently observed network connections, as well as a set information about the internal memory
state of the running application.

Network connection information is maintained for all observed connections in the last 5 minutes. These
connection details include the following information:

- **ProxyIn**: A boolean indicating if the connection is incoming.
- **Downstream Connection**:
  - **RemoteAddr**: The IP address and port number of the remote endpoint.
  - **LocalAddr**: The IP address and port number of the local endpoint.
  - **SockState**: The current state of the downstream socket (e.g., established, closed).
  - **DataTransfer**: Details about data transfer through the downstream socket, including:
    - **TotalRead**: Total bytes read from the sender.
    - **TotalWritten**: Total bytes written to the receiver.
    - **ReaderBuffered**: Bytes currently buffered for internal reading.
    - **WriterAvailable**: Bytes available for writing.
    - **WriterBuffered**: Bytes currently buffered for writing.
    - **BufferLen**: Length of the internal buffer (in bytes).
    - **BufferCap**: Capacity of the internal buffer (in bytes).
    - **Readable**: Bytes readable.
    - **Closed**: Boolean indicating if the socket is closed.
    - **HWMReached**: Number indicating the amount of times the internal buffer high water mark was reached.
- **Upstream Connection**: Same structure as the downstream connection but for the upstream socket.
- **TLS**: Boolean indicating if TLS is used.
- **Protocol**: The protocol used (e.g., HTTP).
- **FirstSender**: Indicates whether the first sender is downstream or upstream.

For reference, downstream connections refer to the network connections between the client and the sidecar. The
client initiates a connection that is intercepted by the transparent proxy. Upstream connections refer to the
network connections between the sidecar and the target server. Once the sidecar intercepts the client's request,
it forwards this request to the destination server, creating an upstream connection.

**Example**
```json
[
    {
        "StartTime": "0001-01-01T00:00:00Z",
        "ProxyIn": true,
        "Downstream": {
            "RemoteAddr": "10.244.1.192:43252",
            "LocalAddr": "10.244.1.206:4143",
            "SockState": "established",
            "DataTransfer": {
                "TotalRead": 160,
                "TotalWritten": 160,
                "ReaderBuffered": 0,
                "WriterAvailable": 128,
                "WriterBuffered": 0,
                "BufferLen": 0,
                "BufferCap": 783,
                "Readable": 0,
                "Closed": true,
                "HWMReached": 44
            }
        },
        "Upstream": {
            "RemoteAddr": "10.244.1.206:8080",
            "LocalAddr": "10.244.1.206:45670",
            "SockState": "unknown",
            "DataTransfer": {
                "TotalRead": 160,
                "TotalWritten": 160,
                "ReaderBuffered": 0,
                "WriterAvailable": 128,
                "WriterBuffered": 0,
                "BufferLen": 0,
                "BufferCap": 783,
                "Readable": 0,
                "Closed": true,
                "HWMReached": 44
            }
        },
        "TLS": false,
        "Protocol": "http",
        "FirstSender": "downstream"
    }
]
```

Memory information that can be obtained via this API as Go [MemStats](https://pkg.go.dev/runtime#MemStats):

**Example**:
```json
{
    "Alloc": 1234567,
    "TotalAlloc": 9876543,
    "Sys": 3141592,
    "Lookups": 42,
    "Mallocs": 1234,
    "Frees": 5678,
    "HeapAlloc": 13579,
    "HeapSys": 24680,
    "HeapIdle": 11223,
    "HeapInuse": 44556,
    "HeapReleased": 7890,
    "HeapObjects": 9876,
    "StackInuse": 12345,
    "StackSys": 23456,
    "MSpanInuse": 3456,
    "MSpanSys": 4567,
    "MCacheInuse": 567,
    "MCacheSys": 678,
    "BuckHashSys": 789,
    "GCSys": 890,
    "OtherSys": 901
}
```

To obtain the memory and connection data, use the following steps to execute a `curl` command within the
`speedscale-goproxy` container.

1. **Open a terminal window.**
2. **Execute the following command** to access the `speedscale-goproxy` container:

```sh
kubectl exec -it <pod-name> -c speedscale-goproxy -- /bin/sh
```

Replace `<pod-name>` with the actual name of the pod running the `speedscale-goproxy` container.

3. **Run the `curl` command** within the container to retrieve the API data:

```sh
curl localhost:4100
```
