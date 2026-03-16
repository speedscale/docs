---
description: "Export traffic captured by Speedscale as Gatling simulation scripts to leverage Gatling's load testing framework for effective API performance testing."
sidebar_position: 3
---

# Export to Gatling

Speedscale can export traffic as [Gatling](https://gatling.io/) simulation scripts. This lets you use Gatling's load testing framework with traffic that was captured by Speedscale. Speedscale takes inbound requests from your snapshot and generates a complete Gatling simulation in Java DSL format, ready to run.

## How it Works

The exporter converts each inbound HTTP/HTTPS request in your snapshot into a Gatling `exec` block with the correct method, URL, headers, query parameters, and body. The result is a standalone `.java` file that can be run directly with Gatling 3.7+.

:::note
Only raw traffic is exported. Transforms and other data manipulation logic are not included in the export due to differences between the automated replay and script-driven paradigms.
:::

## Export

To export your snapshot as a Gatling simulation:

```
speedctl export snapshot --type gatling --output MySimulation.java {SNAPSHOT_ID}
```

### Options

Like other export formats, you can control what gets exported:

```
# Export only inbound traffic (default behavior)
speedctl export snapshot --type gatling --output MySimulation.java {SNAPSHOT_ID}

# Filter to a specific service
speedctl export snapshot --type gatling --service my-service --output MySimulation.java {SNAPSHOT_ID}

# Limit the number of requests
speedctl export snapshot --type gatling --limit 50 --output MySimulation.java {SNAPSHOT_ID}
```

## Running the Simulation

### Prerequisites

- [Gatling 3.7+](https://gatling.io/open-source/) installed
- Java 11+

### Steps

1. Export your snapshot:
   ```
   speedctl export snapshot --type gatling --output MySimulation.java {SNAPSHOT_ID}
   ```

2. Copy the generated `.java` file into your Gatling project's `src/test/java/` directory.

3. Run the simulation:
   ```
   gatling.sh -sf src/test/java -s MySimulation
   ```

## Generated Script Format

The exported simulation uses Gatling's Java DSL and looks like this:

```java
import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import java.util.Map;

public class MySimulation extends Simulation {
  HttpProtocolBuilder httpProtocol = http;

  ScenarioBuilder scn = scenario("Speedscale Export")
    .exec(http("request_0")
      .get("https://api.example.com/users")
      .headers(Map.ofEntries(
        Map.entry("Authorization", "Bearer token"),
        Map.entry("Accept", "application/json")
      ))
    )
    .exec(http("request_1")
      .post("https://api.example.com/orders")
      .headers(Map.ofEntries(
        Map.entry("Content-Type", "application/json")
      ))
      .body(StringBody("{\"item\":\"widget\",\"qty\":5}"))
    );

  {
    setUp(scn.injectOpen(atOnceUsers(1)).protocols(httpProtocol));
  }
}
```

You can customize the generated script to add:
- Ramp-up patterns (e.g., `rampUsers(100).during(60)`)
- Think times between requests
- Assertions and checks
- Feeders for parameterized data

## Capturing Transformed Traffic

If you want to export traffic that has been processed by Speedscale transforms (e.g., JWT regeneration, data masking), you can capture the transformed output:

1. Run a Speedscale replay with your transforms applied
2. Attach a sidecar to capture the outgoing traffic as a new snapshot
3. Export the new snapshot to Gatling format

This doesn't export the transform logic into the script, but it gives you the transformed request data.

## Questions?

Check the latest export options by running:

```
speedctl export snapshot --help
```

Feel free to ask questions on the [Community](https://slack.speedscale.com).
