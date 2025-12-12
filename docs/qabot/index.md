---
title: QABot
sidebar_position: 0
---

# QABot

QABot automates the creation of realistic and reliable tests and service mocks using traffic replay. By recording a running instance of your application and replaying the traffic against it multiple times, QABot compares the results and generates data modification suggestions called Recommendations. These Recommendations are automatically applied to the original snapshot to improve the accuracy of service mocks and tests.

## Overview

Traffic replay solves the problem of needing to write test scripts that immediately fall out of date. QABot solves the data integrity problem that prevents test scripts and mocks from working reliably in a CI pipeline.

The recording of the traffic covers both inbound and outbound HTTP, API and Database requests. QABot compares the results of multiple replay runs and generates Recommendations to handle dynamic data that changes between runs.

## How It Works

QABot operates through the following high-level workflow:

1. **Record a snapshot** of your application running
2. **Provide a test application** that QABot can run multiple tests against
3. **Run QABot comparator** - QABot will re-run test scenarios against the application to see what changes between runs
4. **QABot proposes and applies Recommendations** to the original snapshot
5. **Deploy reliable tests and mocks** - You now have a more reliable set of paired service mocks and tests to insert in your CI pipeline for reliable regression or performance replay

## Problems QABot Solves

QABot automatically identifies and handles data integrity issues in CI pipelines, including:

- **OAuth authorization** from clients
- **Timestamp shifts** that cause replay failures
- **Rotating IDs** that prevent good service mock responses
- **Session token updates** and expiration
- Other dynamic data that changes between test runs

## Quick Links

- Getting Started (Coming Soon)
- Workflow Documentation (Coming Soon)
- CI/CD Integration (Coming Soon)

---

:::tip Active Beta
QABot is currently in active beta. To activate this feature in your environment, join the [Speedscale community](https://speedscale.com/community/) or contact your Speedscale representative.
:::
