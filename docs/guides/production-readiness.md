# Production Readiness

This guide is a comprehensive walkthrough of considerations for recording from a production environment using the Speedscale sidecar. Keep in mind that recording with the sidecar has various pros and cons but alternative collection mechanisms are fully supported. For many customers the sidecar is the easiest option. If you are using an environment other than Kubernetes, this guide may be helpful but much of it will not be relevant. Contact [support](https://slack.speedscale.com) for help tailoring these instructions to your environment.

Prior to reading this guide it may be beneficial to learn about how Speedscale's [architecture](../reference/architecture.md) to have a clear idea of all the moving parts.

This guide is designed to be comprehensive and is broken into three sections:

1. Preparation
2. Deployment
3. Validation

By the end, you will have weighed security concerns, ensured minimal application impact and learned safe deployment strategies.

## Preparation Checklist

- [ ]  SaaS Agreement
- [ ]  Assess your Environment
- [ ]  Roles
- [ ]  Remote Control
- [ ]  Data Loss Prevention (PII)

### SaaS Agreement

Ensure that you have signed the Speedscale SaaS agreement for a commercial license. Speedscale requires this for production deployment support.

### Assess your Environment

The Speedscale sidecar is highly adaptable but does require some configuration. Answer these questions first:

- [ ] Which services do you want to record from?

Speedscale will not automatically record everything in your cluster. By default, individual services must be targeted for recording. Make a list of services you want to target.

- [ ] Are you running on Kubernetes?

If you are not running on Kubernetes then most of these instructions will need to be customized for your environment. It isn't necessarily difficult but [support](https://slack.speedscale.com) is happy to help.

- [ ] Are you utilizing a Service Mesh?

Istio and its derivatives are currently supported natively. Other service meshes may be supported if you contact [support](https://slack.speedscale.com). If you are using Istio you will need to follow the instructions in this [section](../setup/install/istio.md) while configuring the operator. Just save that link for later.

- [ ] Does your cluster have resources to support the extra recording workload?

Speedscale is optimized for application latency impact, CPU impact and then memory impact. Speedscale engineering optimizes the sidecar in this order to give maximum control and flexibility to users. For instance, the Speedscale sidecar will sacrifice memory and CPU usage to prevent it from impacting the application. However, recording does require some resources and we will size them later in this guide. As seen with similar projects like Envoy, we aim for maximum efficiency but the work still needs to be done somewhere.

- [ ] Do you have security tools in place that will prevent Speedscale from working properly?

Sidecars require network manipulation. Some security tools are installed at the cluster level that prevent north-south and/or even east/west communication between pods. These issues can be very hard to diagnose because they present as obscure network timeouts. It is beneficial to ask your security team if any of these tools are installed. Alternatively, you can look at the other namespaces in the cluster to get a hint. If you see things like `twistlock` or `calico-` then it is possible these tools are present and configured to prevent certain activities. Speedscale has recipes for dealing with many security tools while preserving cluster security. These are available on demand from support.

### Roles

Are you directly responsible for modifying your production cluster? If not, send this guide to your DevOps/SRE/Platform Eng team early and let them think through what changes need to be made. Production deployment requires balancing many concerns and the SRE job description typically does not include the bullet "enjoys surprises."

### Remote Control

Speedscale is designed to be installed in the cluster and then (optionally) remotely controlled by users that do not have access to the cluster. This is done so that the DevOps/SRE/Platform Engineering teams are not constantly working on the cluster for day-to-day activities. Regular engineers can perform their work independently in this mode as long as they stay in allowed lanes. However, while this works very well for clusters that are intended for simulation, it is overly permissive for most production environment.

For clusters solely used for production recording, Speedscale recommends disabling remote control for security purposes. In this mode, CRs or Annotations must be applied directly to the cluster to both add sidecars and initiate replays. Forcing all changes to be done by a user with appropriate Kubernetes RBAC permissions may make it harder to make changes, the tradeoff is usually worth it for prod.

All Remote Control functionality is wrapped in a completely separate container. When it is turned off, this container is not deployed and so no remote execution functionality is even present.

To disable Remote Control you set `dashboardAccess` to `false` in the Speedscale helm chart. The default value is `true`

[https://github.com/speedscale/operator-helm/blob/main/values.yaml#L33](https://github.com/speedscale/operator-helm/blob/main/values.yaml#L33)

### Data Loss Prevention

Speedscale can be configured to redact sensitive data and personally identifiable information (PII) from traffic via it's data loss prevention (DLP) features. This redaction happens *before* data leaves your network, preventing Speedscale from seeing the data at all. Most customers test their DLP configuration in another cluster before applying to production.

[Data Loss Prevention (DLP) | Speedscale Docs](https://docs.speedscale.com/guides/dlp/)

https://github.com/speedscale/operator-helm/blob/main/values.yaml#L38

This is the ideal process for validating DLP settings:

1. Create a DLP Rule (it can be blank to start with). The purpose of this is to redact specific fields that are being sent (ex: an authorization token or user email address)
2. Install Speedscale via the helm chart and set:
    1. `dlp.enabled` to `true` 
    2. `dlp.config` to the name of your custom DLP Rule
3. Confirm in the logs of the operator that your DLP rules are used.
4. Install the sidecar on the micro service.
5. Add a DLP rule to redact a given field
    1. You should see this causes the forwarder to restart with the new rule being applied.
    2. Validate the field is redacted
    3. Repeat as needed for multiple fields

Once this process is complete you have a DLP configuration that can be used in production.

### Traffic Filtering

Filter rules can be used to completely block traffic from ever being sent to Speedscale (ex: health checks or monitoring systems or data that is out of scope for your use case). You can create a Filter Rule (we recommend you copy `standard` and add your settings to it).

[https://github.com/speedscale/operator-helm/blob/main/values.yaml#L35](https://github.com/speedscale/operator-helm/blob/main/values.yaml#L35)

Once this process is complete you have a Filter configuration that can be used in production. Keep in mind that this is one of the best ways to control your ingest volume and reduce network egress traffic.

:::callout
Filter rules can be tuned after deployment but if Remote Control is turned off then changes may require cluster access.
:::

## Deployment Checklist

- [ ]  Operator Customization
- [ ]  Forwarder Resources
- [ ]  Pod Sampling and Rollout

In this section we will deploy the operator and then show you a strategy on how to set up a canary deployment for only part of your application traffic. This guide assumes you are already familiar with the Speedscale helm [chart](https://github.com/speedscale/operator-helm) and [helm](https://helm.sh/docs/intro/using_helm/) deployment workflow.

### Operator Customization

The [chart](https://github.com/speedscale/operator-helm) chart will install a mutating webhook that is called any time a deployment occurs in the cluster. You can scope this to a subset of namespaces by setting `namespaceSelector`

[https://github.com/speedscale/operator-helm/blob/main/values.yaml#L29](https://github.com/speedscale/operator-helm/blob/main/values.yaml#L29)

In a large environment with hundreds or thousands of deployments, the operator may need additional resources, you can increase the resources in the helm chart.

[https://github.com/speedscale/operator-helm/blob/main/values.yaml#L93](https://github.com/speedscale/operator-helm/blob/main/values.yaml#L93)

The fastest way to know the operator is resource constrained is to check the resources used vs limits in your monitoring dashboard. Alerts may also appear in the Infrastructure section of the Speedscale UI.

### Forwarder Resources

In a large environment with hundreds of gigs of traffic, the forwarder may need additional resources, you can increase the resources in the helm chart:

[https://github.com/speedscale/operator-helm/blob/main/values.yaml#L124](https://github.com/speedscale/operator-helm/blob/main/values.yaml#L124)

The fastest way to know the forwarder is resource constrained is to check the resources used vs limits in your monitoring dashboard. Alerts may also appear in the Infrastructure section of the Speedscale UI.

### Sidecar Customization

Assuming Remote Control is disabled, you will apply the sidecar using either annotations or the `trafficreplay` CR.

On an application with very high throughput, the sidecar may need additional resources, you can customize the sidecar resources that are used by default on each sidecar by customizing the helm chart:

[https://github.com/speedscale/operator-helm/blob/main/values.yaml#L104](https://github.com/speedscale/operator-helm/blob/main/values.yaml#L104)

In addition to the resources, there are numerous other ways to customize the sidecar. For example if there is traffic that is not required, you can completely block that port or host. There is a complete set of annotations for customization here:

[https://docs.speedscale.com/setup/sidecar/annotations/](https://docs.speedscale.com/setup/sidecar/annotations/)

## Pod Sampling

Sampling or "canary deployment" is an effective way to limit the blast radius of any change. There are multiple ways to configure sampling for pods that are built into Kubernetes. Here are 2 options:

1. Additional Deployments with same label
2. Using Istio Traffic Management (if deployed)

### Deployments with Label

Let’s say you have a simple deployment with 3 replicas:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  labels:
    app: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: gcr.io/speedscale-demos/frontend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
```

And a simple service that will route to those 3 replicas:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  labels:
    app: frontend
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 80
      targetPort: 8080
  selector:
    app: frontend

```

It is possible to create an additional deployment with a different name but the same labels, and in addition this has the sidecar:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations:
    sidecar.speedscale.com/inject: "true"
  name: frontend-sidecar
  labels:
    app: frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: gcr.io/speedscale-demos/frontend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
```

Now you have a total of 4 pods, 3 of them without the sidecar and 1 with the sidecar. This is a very simple way to set up sampling. However, if you have a complex environment with pod autoscaling this may change the distribution of how much traffic is sampled.

```bash
$ kubectl -n microservices-istio get pods -l app=frontend
NAME                                READY   STATUS    RESTARTS   AGE
frontend-68ff688844-2n4tk           2/2     Running   0          38s
frontend-68ff688844-rjdn8           2/2     Running   0          60s
frontend-68ff688844-rrmtg           2/2     Running   0          82s
frontend-sidecar-5f4fc8f8c8-xfnll   3/3     Running   0          70s
```

Here you can see only the pod called `frontend-sidecar` has `3/3` containers, and the others have `2/2` containers (only istio and the application).

### (optional) Istio Traffic Management

Because deployment is highly customizable, it is recommended that the DevOps/SRE/Platform Eng team utilize a well-known pattern for canary deployments, then split the traffic among these. This is a more sophisticated way to handle the routing and you can ensure that a specific % of the traffic is going to the pods with the sidecars. Use this instead of the manual process in the previous section.

Take a look at Istio's official guide and tailor to your environment.
[Traffic Management](https://istio.io/latest/docs/concepts/traffic-management/)

## Validation

At this point you should have the operator deployed (via helm) and at least a canary sidecar deployment. It's wise to take a moment to check resource utilization and functionality before going further.

Open your normal Kubernetes monitoring solution and check CPU/Memory utilization versus the assigned limits. If the limits are being exceeded then you will need to modify the helm chart to increase available limits. If you do not have a monitoring solution we recommend [k9s](https://github.com/derailed/k9s) as a fast and pleasant option. You should verify the operator, forwarder and sidecars to be sure.

Next, check your application latency vs historical averages to make sure the impact is not unexpected. Keep in mind that some small latency impact is normal. If you're seeing excessive latency we have an extensive diagnostics [metrics](../setup/sidecar/performance.md) guide. As always, feel free to reach out to [support](https://slack.speedscale.com).
