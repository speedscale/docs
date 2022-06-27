# Capturing Traffic

Speedscale captures traffic flowing through your application.
This includes inbound as well as outbound, and is handled by a proxy sidebar added to your workloads.

## Why capture traffic?

Capturing traffic is necessary for replaying traffic.
This is more accurate than simulated tests because it's the actual data that would flow through your application.
By using real data, it is easier to diagnose and reproduce problems, such as an occasional spike in traffic that causes downtime.

Additionally, that data can provide a basis for load testing.
Using Speedscale's test configurations, the traffic can be multiplied, replayed over a longer period, or have various errors introduced to do chaos testing.
