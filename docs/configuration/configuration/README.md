---
description: Customize how the replay is performed.
---

# Test Config

Speedscale's load generator relies upon a basic set of config items to
determine how it will behave at runtime. You can view these in the
[UI](https://app.speedscale.com/config) or via the CLI.

```bash
speedctl get testconfigs
speedctl get testconfig standard
```

### Structure

There are three sections within a Test Config:

1. **Assertions** - outlines expected responses from the application
2. **Replay rules** - how load will be generated and how mocks will behave (incl. Chaos)
3. **Goals** - what thresholds will constitute a failed test report

![Test Configs](./test-config.png)
