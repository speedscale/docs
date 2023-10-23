---
sidebar_position: 3
---

# Local Testing Transforms

When building transforms, sometimes referred to as tokenconfigs, it is often useful to test a transform locally in a fast feedback loop before pushing to Speedscale cloud. Rapid iteration is a core Speedscale product principle so we attempt to make this easy.

`speedctl` provides the ability to locally analyze a set of traffic in exactly the same way that Speedscale cloud does. This facilitates local testing of transforms without the back and forth between the cloud and your local desktop.

#### transform Command

```
speedctl transform <raw file> <token config file>
```

Use the speedctl transform command to apply a local token configuration to a snapshot raw file. `speedctl` will use the analyzer to generate an `action`, `reaction` and `streams` file.

After running this command, you can inspect the output to see if the generator and responder will behave as expected.
