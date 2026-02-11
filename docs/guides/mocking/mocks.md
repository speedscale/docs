---
title: Mocks & Service Virtualization
sidebar_position: 1
---

# Mocking and Service Virtualization

Environment replication only works if back end dependencies can be reliably simulated. The traditional term for simulating a realistic service is either mocking or [service virtualization](https://en.wikipedia.org/wiki/Service_virtualization). Generally, mocking means writing custom code that is maintained alongside your application and hand curated. Service virtualization adds the idea of moving the mocks onto a programmable server to facilitate scaling and resource utilization.

Generally speaking, both mocks and service virtualization have significant flaws that make adoption very challenging. Namely,

* Mocks do not typically reflect a high diversity of data and thus do not reflect real user behavior.
* Mocks must be continuously maintained to match the test case profile. For example, if you want to test looking up a statement balance then there needs to be a mock providing the statement info to the code being validated.
* Mocks and service virtualization often requires changes to the service under test, causing maintenance headaches and possibly distorting results. For instance, you may have to change the endpoint being called so it points at your mock and remember to change it back.

For these reasons and others, many organizations have moved away from the entire concept of mocking. However, Speedscale combines traffic replication with service virtualization to create an Environment Replication system. Environment replication involves simulating the active parts of the runtime environment completely. This involves a form of service virtualization and many of the concepts are similar. However, when run in Kubernetes, Speedscale is different in that it will:
* automatically create mocks that are just as real as production
* automatically refresh mocks from running systems so they are always current
* automatically re-route the network and TLS so no app changes are made

In the following sections we will discuss Speedscale's unique approach to service virtualization as well as explore common usage patterns.