---
sidebar_position: 0
---

# eBPF Traffic Collection

## What is eBPF?

eBPF (extended Berkeley Packet Filter) is a Linux kernel technology that allows running sandboxed programs in
the kernel without changing kernel source code or loading kernel modules. Many Kubernetes networking tools
such as [Cilium](https://cilium.io/) use eBPF for efficient, low-overhead traffic observation.

## How Speedscale Uses eBPF

Speedscale's eBPF collector `nettap` runs as a Kubernetes **DaemonSet** on each node. It attaches lightweight
probes to the kernel and to specific user-space libraries to observe network traffic without proxies,
sidecars, or application changes.

### Plaintext TCP Traffic

Kernel-level **kprobes** attach to TCP send/receive functions to observe plaintext TCP traffic directly in the
kernel's network stack. This captures traffic for any application on the node without needing per-process
instrumentation.

### TLS Traffic

See [TLS Traffic Visibility](#tls-traffic-visibility) below for details on how encrypted traffic is
captured in plaintext.

### DNS Enrichment

`nettap` observes DNS traffic in order to build an IP-to-hostname mapping table. This enriches captured
traffic with the original hostnames so that traffic is displayed with meaningful service names rather than raw
IP addresses. This is particularly useful for non-HTTP protocols where there is no equivalent to the HTTP
`Host` header.

### Kubernetes Integration

`nettap` runs with `hostNetwork` and `hostPID` enabled, giving it visibility into all pods on the node. It
uses this ability along with the Kubernetes API in order to map connections back to specific pods, enriching
captured traffic with pod name, namespace, labels, and other metadata.

## TLS Traffic Visibility

Speedscale captures TLS-encrypted traffic in plaintext, without needing certificates, proxies, or application
changes.

### OpenSSL 3.x

**uprobes** attach to read/write functions in OpenSSL 3.x for processes that use it. `nettap`
auto-detects the OpenSSL library loaded by each process and attaches probes dynamically. This captures
plaintext data after decryption (reads) and before encryption (writes).

### Go Native TLS

For Go applications using the standard `crypto/tls` package, `nettap` attaches **uprobes** directly
to Go's TLS read and write functions. This requires:

- Go version 1.18 or later
- **Unstripped binaries** (symbol table must be present for probe attachment so binaries must be built without `-ldflags="-s"`)

### Java (JVMTI Agent)

JVM-based applications require a separate mechanism rather than eBPF probes: a **JVMTI agent** that
instruments Java's TLS layer from within the JVM. This captures plaintext traffic for any Java application
using standard TLS libraries (e.g., `javax.net.ssl`).

### What This Means in Practice

- No TLS certificates to install or manage
- No proxy sidecars to deploy or configure
- No application code changes or recompilation
- Full HTTP/HTTPS request and response visibility including headers and bodies

## Requirements

- **Architecture:** `x86_64` or `arm64`
- **Linux Kernel 5.17+** with BTF (BPF Type Format) support enabled. BTF provides portable type information
  that allows the `nettap` probes to work across different kernel versions without recompilation

### Capabilities

`nettap` requires the following Linux capabilities:

| Capability        | Purpose                                          |
|-------------------|--------------------------------------------------|
| `CAP_BPF`         | Load and manage eBPF programs                    |
| `CAP_PERFMON`     | Access perf events and ring buffers              |
| `CAP_NET_ADMIN`   | Attach network-related probes                    |
| `CAP_SYS_PTRACE`  | PID namespace identification                     |

### Kubernetes Deployment

`nettap` runs as a **DaemonSet** with:

- `hostNetwork: true` - visibility into host-level network traffic to capture traffic for any pod scheduled on the node
- `hostPID: true` - ability to discover and attach probes to application processes for any pod scheduled on the node

## Limitations

- **Go binaries must not be stripped** - Go native TLS capture requires preserving the ELF symbol table. Binaries
  built with `-ldflags="-s"` or otherwise stripped will not have TLS traffic captured. Plaintext
  TCP traffic is still captured.
- **Mid-stream connections** - Connections established before `nettap` attaches probes will not
  have their initial handshake or early data captured. Subsequent requests on those connections are
  captured normally.
- **TCP only** - `nettap` captures TCP traffic only. UDP is only captured for DNS resolution (port 53).
- **OpenSSL version** - TLS capture via uprobes is limited to OpenSSL 3.x. Applications using older
  OpenSSL versions, BoringSSL, or LibreSSL will not have TLS traffic captured, though plaintext TCP
  traffic is still visible.

## Overhead

eBPF-based collection is designed for minimal production impact across three dimensions:

### Latency

`nettap` observes traffic passively - it does not sit in the data path. Probes execute in-kernel
alongside normal network operations, adding no measurable latency to application requests or responses.

### CPU

eBPF programs consume a small amount of CPU for event processing and delivery to user space. Under
typical workloads, this is low single-digit percentage overhead compared to total node CPU.

### Memory

eBPF programs and their associated maps use a bounded amount of kernel memory, typically on the order
of hundreds of kilobytes per program. `nettap` avoids unbounded allocations and maintains stable
memory usage over time.

For detailed resource utilization data, see [Resource Utilization](resource-utilization.md).

## Sidecar vs eBPF

Choosing between sidecar-based and eBPF-based traffic collection depends on your environment and
requirements.

### When to Use eBPF

- You want **frictionless** traffic capture that does not require workload modifications
- You want **node-level visibility** without per-pod sidecars
- You need to capture TLS traffic **without managing certificates** or modifying deployments
- You want to **minimize resource overhead** and avoid sidecar CPU/memory costs

### When to Use Sidecars/Proxies

- Your cluster restricts the elevated permissions required to instrument eBPF probes
- Your environment requires **per-pod traffic control** with fine-grained policies
- You are using nodes with **older kernels** that don't meet eBPF requirements
- You need to capture TLS traffic from applications using TLS libraries not yet supported by the
  eBPF collector
