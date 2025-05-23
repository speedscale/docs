---
title: Signature Matching
sidebar_position: 3
---

# Signature Matching

Most non-trivial applications rely on external systems like 3rd party APIs or databases to function. This is especially true for apps that utilize microservices architectures. [Mocks](/reference/glossary.md#mock) can be generated by hand using **proxymock** or automatically by Speedscale Enterprise. Examples of services that could be mocked include the Google API, the AWS API postgres or another team's HTTP REST endpoint.

## How does it work?

Service mocks are generally made available over the network and are accessible to your app in a test environment or on the local desktop. If your service mocks are working properly, your service under test ([SUT](/reference/glossary.md#sut)) will believe it is actually running in production because the mock is convincing. A realistic service mock must simulate the following components:

- data that is similar to production
- realistic response time (not too fast, not too slow)
- accurate response sequencing for non-idempotent requests
- continuously updated tokens like authentication, etc

## How does it know which response to return?

**proxymock** uses a special text string called a _signature_ to differentiate between different requests. When the service under test (SUT) sends a request to **proxymock**, selective nuggets of information are extracted from the request and added to the signature. Typically this includes things like HTTP Query Parameters or MySQL SQL statements. Once this signature is generated, it is matched against the library of signatures generated from the previously recorded traffic. When the incoming signature matches a previously recorded one, the related response is returned.

The sequence of events goes like this:

1. Traffic is recorded/imported to **proxymock**
2. You create a Snapshot containing traffic covering a specific timeframe and filter criteria.
3. The **proxymock** analyzer combines the traffic into a set of signature/response pairs. This is like a compiler which builds source files into a working program.
4. The **proxymock** service mocking engine receives a message from the SUT and creates a signature.
5. The request signature is compared against all known request signatures in the Snapshot.
6. A response is returned if the signature is recognized or a 404 if it is unknown.
7. If multiple requests have the same signature but different responses, **proxymock** will cycle through the responses in order.

Fundamentally, the signature is a hash map of key=value pairs. The objective of adding transforms to the signature is to make it match with a particular response found in the response. The service mock engine will apply the transforms to the incoming request and based on those modifications it will attempt to find a match in the snapshot. So the purpose of this exercise is to modify miss or passthrough requests individually using transforms until they match an existing response in the snapshot.

**proxymock**` will automatically generate signatures for common protocols such as HTTP and Postgres. Modification of these signatures is possible and covered in this section. By adding new requests to your traffic snapshot you effectively add new service mock known responses. During environment replication, **proxymock** will return the response matching what was recorded in the original environment.

:::tip
You may notice an `instance` field in the signature. This is used to differentiate between multiple requests that are identical. If you modify the instance, you cause the service mock to return this response the nth time this signature is received.
:::

Take the following HTTP request as an example:

```
POST /foo-platform/pdt/foo/management HTTP/1.1
Content-Type: application/xml; charset=ISO-8859-1

<my request body>
```

This HTTP request would generate a signature similar to the following:

```json
{
  "http:host": "localhost",
  "http:method": "POST",
  "http:url": "/foo-platform/pdt/foo/management",
  "http:requestBodyJSON": "G15IHJlcXVlc3QgYm9keT4=",
  "instance": "1"
}
```

Signatures are essentially hash maps of key=value pairs.

## What kind of dependencies can be automatically mocked?

**proxymock** automatically mocks any technology on our [supported technology page](/reference/technology-support.md). We've created baselines that work in most situations but you can customize as described below.

## What happens if my requests are non-idempotent (aka the response changes after each request)?

**proxymock** is capable of handling non-idempotent responses but it will require you to copy/paste an rrpair and modify the response. **proxymock** will return each response in order based on the order of the responses in the raw.jsonl. Make sure the signature stays the same.

Speedscale Enterprise automatically handles changing responses and is smart enough to deal with many common patterns without human intervention. The fancypants Speedscale Enterprise product incorporates a learning model that mutates based on the protocol and specific API type being monitored. Even if Speedscale has never seen your API before there is a good probability of it being able to automatically mock your dependency without training. Yes that is technically a plug for the paid product but handling this use case without automation is likely to make you sad so don't say we didn't warn you.

## What if **proxymock** cannot automatically mock my dependency?

You can request new protocol support in the Speedscale [community Slack](https://slack.speedscale.com). Otherwise, you will need to provide your own replica of the dependency. Typically this involves writing a custom mock server using a framework like [Mockito](https://site.mockito.org/) or [gomock](https://github.com/golang/mock). For databases this gets a lot more involved and will require database replication tools.

## What are some of the downsides of service mocking?

Custom built service mocks tend to fall out of date quickly because the data or the API contract changes. For this reason we recommend regenerating your mocks automatically using **proxymock** every sprint (if possible).
