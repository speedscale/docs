---
description: "Learn how to define Target Hostname extractors in Speedscale to efficiently filter and manipulate traffic data according to your application's needs. This documentation provides detailed guidance on implementation and configuration for optimal traffic analysis."
sidebar_position: 17
---

# target_hostname

### Purpose

**target_hostname** extracts the target hostname, the URL host not including the port, from the RRPair.  Extracting the target host can be used to change the URL of a request during replay.  Note, this is distinct from the host header which may be different than the target host and can be extracted through the [http_req_header extractor](./http_req_header.md).

The target hostname value does not include the port.  Modify the port with the [target_port extractor](./target_port.md).

### Usage

```json
"type": "target_hostname"
```

### Example

```json
"type": "target_hostname",
```
