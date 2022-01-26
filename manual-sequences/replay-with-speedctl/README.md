---
description: >-
  It is recommended to use the operator, but you can also deploy the components
  manually.
---

# Manually Running a Replay in Kubernetes

There are 2 main components to the replay mechanism, and you can use them independently:

* Generator is used to replay traffic into a pod
* Responder is used to respond to outbound calls leaving the pod

You can use them in various combinations:

* Generator only - you are responsible for supplying the full environment needed
* Generator + Responder - Speedscale will supply an environment for calls that leave the pod
* Responder only - you are responsible for supplying the test cases
