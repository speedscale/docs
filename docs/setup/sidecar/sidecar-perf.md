
# Sidecar Performance

The sidecar proxy can add latency and impact performance in the same way an Envoy or nginx proxy can. The exact impact of the proxy will vary based upon your workload and conditions. For that reason, we recommend testing the sidecar in pre-production and then using a progressive rollout strategy in production. Due to high variability, Speedscale does not currently publish benchmarks.

## Testing sidecar latency in pre-production

We recommend testing latency and overhead on a pre-production workload using this procedure:
1. Add monitoring for CPU and memory to your service. Just watching a tool like [k9s](https://k9scli.io/) and is sometimes sufficient. If you want to get fancy you use other tools like [ContainIQ](https://www.containiq.com/) or [Pixie](https://github.com/pixie-io/pixie).
2. Establish a baseline by running a consistent workload like a load test. Using Speedscale to replay and scale up volume is a great idea but you can also use existing load testing scripts.
3. Record the CPU, memory usage and **average latency** over the course of the load test.
4. Install the Speedscale sidecar
5. Re-run the same load test.
6. Compare results.

Even without changing anything it is unlikely that the CPU, memory and latency measurements will be the same between load tests. Results tend to be variable even in a system that appears static. However, this procedure will give you a rough idea whether the sidecar has a large impact.

## Progressive rollout

We recommend using a standard progressive rollout methodology in production. This procedure will vary greatly depending on your deployment strategy. Generally, it is advisable install the sidecar on a single pod and slowly expand to other pods after verifying the health of the application. You should avoid applying the sidecar to your entire deployemnt at once.
