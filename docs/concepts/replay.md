---
sidebar_position: 2
---
# Replaying Traffic

Speedscale replays real traffic captured in your system.
It does this by creating two services: a generator and a responder.

## Why generate traffic?

The generator is responsible for sending inbound traffic to your application.
Traffic captured in a snapshot will be sent to the generator, which will then call the specified application using the same parameters captured.
HTTP requests, database queries, and cache lookups can be repeated in order to help diagnose issues.
Speedscale is even capable of using a snapshot captured in production against a local development environment.
Additionally, the generator can transform traffic so that different values can be tested, higher load can be sent, or provide assertions against responses.

## Why respond to traffic?

Most modern applications will integrate with external applications and services.
These third party applications can be time consuming to mock out, and sending traffic to the actual service could cost money, as well as lead to bad data.

The responder fixes this by replay the outbound traffic responses observed during capture.
Responses from third party applications can be presented to your application as they were received, allowing you to create mocked test environments easily.
Similarly, traffic responses can be used to validate that changes to your application work as expected against your production environment without requiring a full deployment to a test cluster.
