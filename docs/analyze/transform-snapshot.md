---
sidebar_position: 3
---

# Transform Snapshot

Add transforms to change data before replay

The Speedscale analyzer examines a set of traffic and outputs the artifacts needed for replay:

* **action file** - a set of RRPair data prepared for the generator
* **reaction file** - a set of signatures (request patterns) and responses for the responder
* **raw file -** a set of traffic matching the filter criteria

In many cases, the process will work out of the box using the `standard` tokenizer configuration.

Some applications will require custom configuration using either [tokenizers](../configuration/tokenizers-1/) or [transforms](../configuration/transform-traffic/).  Read these sections before continuing.

This process can become complex so make sure to join the Speedscale Slack [community](http://slack.speedscale.com) and we will be happy to walk through your specific use case.

As a basic starting point, the snapshot transform configuration has the following sections:

* **generator** - applied to all RRPairs in the action file
* **generatorVariables** - used to store values used by the generator repeatedly - not used by the analyzer
  * a Kubernetes secret used to sign JWT tokens
* **responder** - applied to all RRPairs in the reaction file for the purposes of signature matching
  * update the request header to match a variety of values instead of just one
* **responderVariables** - used to store values used by the responder repeatedly - not used by the analyzer
  * an environment variable used by the service under test
* **responderResp** - applied to responder responses before being sent to the service under test
  * a date may need to be changed to the current date instead of when the snapshot was taken

Each transform section is a complete transform configuration as detailed in the [Transform Traffic](../configuration/transform-traffic/) section.
