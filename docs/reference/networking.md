---
description: "Understand the networking requirements for Speedscale, including webhook access and traffic configurations necessary for optimal operation in Kubernetes environments."
sidebar_position: 11
---

# Networking Requirements

import ExternalServices from '@site/src/partials/reference/external-services.mdx'

:::tip Using Claude, Codex, or another AI coding assistant?
You don't have to translate these requirements into firewall rules by hand. Copy the
[Speedscale firewall advisor skill](#ai-assisted-firewall-configuration) at the bottom of
this page into your coding assistant and it will inspect your environment (GKE, EKS, AKS,
private VPCs, proxies, service meshes), find what's blocked, and recommend the exact rules
to apply — without changing anything itself.
:::

In order to operate properly, the Speedscale operator requires network access to the following services:

<ExternalServices />

## Cluster Webhook Access

Within your Kubernetes cluster, the Speedscale Operator relies on using [Kubernetes webhooks](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) to interact with workloads.
Speedscale's webhooks run within the Operator's pod over TCP on port 9443.
Traffic must be able to reach the pod and port in order for the Speedscale Operator to capture traffic.

Some environments, such as Google Kubernetes Engine Private Clusters, block webhook traffic by default.
To allow webhook traffic within your GKE Private Cluster, please consult the [GKE Private Cluster documentation on firewall rules](https://cloud.google.com/kubernetes-engine/docs/how-to/private-clusters#add_firewall_rules).

## AI-Assisted Firewall Configuration

If you use an LLM coding harness — [Claude Code](https://claude.com/claude-code), OpenAI
Codex, Cursor, or similar — the skill below turns it into a read-only firewall advisor for
Speedscale. It fetches the current host list from this page, inspects your cluster and
cloud environment with read-only commands, probes which endpoints are actually blocked,
and outputs the specific rules to apply for your scenario (GKE private clusters, EKS/VPC
egress controls, Azure Firewall, corporate proxies, NetworkPolicy/Cilium, Istio). It
never modifies your environment — every recommendation is emitted as commands for you to
review and run.

To install:

- **Claude Code**: save the block below as `~/.claude/skills/speedscale-firewall-advisor/SKILL.md`
  (or `.claude/skills/speedscale-firewall-advisor/SKILL.md` in your project), then ask
  something like *"figure out what firewall rules Speedscale needs in this cluster"*.
- **Codex, Cursor, or other harnesses**: paste the block into your instructions file
  (`AGENTS.md`, rules, or directly into the prompt) and ask the same question.

````markdown title="SKILL.md"
---
name: speedscale-firewall-advisor
description: Diagnose and recommend (never apply) firewall/egress rules needed for Speedscale to reach its cloud from the user's environment. Use when the operator or forwarder can't reach app.speedscale.com, webhooks time out, traffic isn't appearing in the dashboard, or the user asks "what firewall rules does Speedscale need" on GKE, EKS, AKS, a private VPC, behind a corporate proxy, or with a service mesh / NetworkPolicy in place.
---

# Speedscale Firewall Advisor

You are a **read-only recommender**. You inspect the user's environment, figure out
which of Speedscale's network requirements are blocked and why, and emit the exact
commands or config the user (or their platform team) should apply. You never apply
them yourself.

## Hard rules

- **Never run a mutating command.** No `gcloud compute firewall-rules create`, no
  `aws ec2 authorize-security-group-*`, no `kubectl apply/patch/delete`, no Terraform.
  Every remediation is *output as text* for the user to review and run.
- Read-only inspection is allowed and encouraged: `kubectl get/describe/logs/exec`
  (exec only to run `curl`/`nc` connectivity probes inside an existing pod),
  `gcloud ... describe/list`, `aws ... describe-*/get-*`, `az ... show/list`.
- If a probe would require *creating* a pod (no suitable pod exists to exec into),
  print the `kubectl run` command as a recommendation and ask before running it.
- Recommend **hostname/SNI-based allowlisting, not IP allowlisting**. The endpoint
  list is subject to change and includes AWS-managed services whose IPs rotate. Only
  fall back to IP ranges if the user's firewall genuinely cannot filter on SNI/FQDN,
  and then point them at the published ranges (AWS `ip-ranges.json`, Google netblocks)
  rather than hardcoding addresses.

## Step 1 — Get the current requirements (do not trust a cached list)

Fetch https://docs.speedscale.com/reference/networking/ and extract the live host
list. The list below is a fallback snapshot for offline use only; the docs page wins
on any conflict.

**Outbound HTTPS (TCP 443) from every node running Speedscale components**
(operator, forwarder, sidecar/goproxy, collector — and any workstation running
`speedctl`/`proxymock`):

| Host | Purpose |
|---|---|
| `app.speedscale.com` | API / control plane |
| `downloads.speedscale.com` | Component downloads |
| `firehose.us-east-1.amazonaws.com` | Traffic data streaming |
| `sqs.us-east-1.amazonaws.com` | Message queue |
| `sns.us-east-1.amazonaws.com` | Notifications |
| `s3.us-east-1.amazonaws.com`, `*.s3.us-east-1.amazonaws.com` | Snapshot/object storage |
| `sts.amazonaws.com`, `sts.us-east-1.amazonaws.com` | Credential exchange |
| `monitoring.us-east-1.amazonaws.com` | Metrics |
| `gcr.io` | Container images |
| `speedscale.github.io` | Helm charts |

Note: the AWS endpoints are **always us-east-1** regardless of where the user's
cluster runs — VPC endpoints in the cluster's own region will not cover them.

**Inbound (in-cluster): TCP 9443 to the Speedscale operator pod** — the Kubernetes
API server must reach the operator's mutating/validating webhook. This is
node-internal traffic on most clusters but is **blocked by default on GKE private
clusters** (control-plane → node firewall only opens 443/10250).

## Step 2 — Discover the environment (read-only)

Establish, in order:

1. **Where are they?** `kubectl config current-context`, `kubectl get nodes -o wide`
   and node `spec.providerID` / labels → GKE vs EKS vs AKS vs on-prem/kind. Note
   whether they're asking about a cluster at all, or a workstation/CI running
   `proxymock`/`speedctl` (then only the outbound list matters — no 9443).
2. **What's installed?** `kubectl get pods -n speedscale`,
   `kubectl get mutatingwebhookconfigurations,validatingwebhookconfigurations | grep -i speedscale`.
3. **Egress posture:**
   - Proxy: `kubectl get deploy -n speedscale -o yaml | grep -iE 'http_proxy|https_proxy|no_proxy'`.
   - NetworkPolicy/CNI: `kubectl get netpol -A`, `kubectl get ciliumnetworkpolicies -A 2>/dev/null`,
     check for Calico/Cilium pods.
   - Service mesh: `kubectl get ns istio-system linkerd 2>/dev/null`, sidecar
     containers on Speedscale pods, `kubectl get serviceentries -A 2>/dev/null`.
   - OpenShift: `kubectl get egressfirewalls -A 2>/dev/null`.
4. **Provider-side details** (only with the user's cloud CLI, read-only):
   - GKE: `gcloud container clusters describe <cluster> --format='value(privateClusterConfig)'`
     → private cluster? master CIDR? `gcloud compute firewall-rules list --filter='name~gke-<cluster>'`.
   - EKS: `aws eks describe-cluster`, security groups on the node group
     (`aws ec2 describe-security-groups`), NAT gateway / Network Firewall presence
     (`aws ec2 describe-nat-gateways`, `aws network-firewall list-firewalls`).
   - AKS: `az aks show` → `outboundType` (loadBalancer vs userDefinedRouting →
     Azure Firewall likely).

## Step 3 — Diagnose before recommending

Don't dump the whole rule catalog; find what is actually blocked.

- **Outbound probe** — exec into an existing Speedscale pod (operator or forwarder)
  and probe each host from Step 1:

  ```bash
  kubectl exec -n speedscale deploy/speedscale-operator -- sh -c \
    'for h in app.speedscale.com downloads.speedscale.com firehose.us-east-1.amazonaws.com sqs.us-east-1.amazonaws.com s3.us-east-1.amazonaws.com sts.amazonaws.com gcr.io speedscale.github.io; do
       (wget -q --spider --timeout=5 https://$h 2>/dev/null || curl -sfm5 -o /dev/null https://$h) && echo "OK   $h" || echo "FAIL $h"; done'
  ```

  A FAIL that resolves DNS but times out → firewall/egress. NXDOMAIN → DNS policy.
  TLS errors mentioning an unexpected issuer → TLS-inspecting proxy.
- **Webhook probe** — `kubectl get events -A | grep -i 'webhook.*speedscale'` and
  operator logs. The classic GKE-private-cluster signature: workload deploys hang or
  fail with `failed calling webhook ... context deadline exceeded` on port 9443.
- **Operator logs** — `kubectl logs -n speedscale deploy/speedscale-operator --tail=200`
  for connection-refused/timeout lines naming a specific host; that host tells you
  which rule is missing.

## Step 4 — Emit recommendations for the detected scenario

Output: (a) a one-paragraph diagnosis, (b) the minimal rule set as ready-to-run
commands/config **clearly labeled "for you to review and apply"**, (c) a
verification command to re-run after they apply it. Use only the scenario(s) that
match; templates below.

### GKE private cluster (webhook blocked)

```bash
# Allow the GKE control plane to reach the Speedscale operator webhook.
# <MASTER_CIDR> from: gcloud container clusters describe <cluster> --format='value(privateClusterConfig.masterIpv4CidrBlock)'
# <NETWORK> and <TARGET_TAGS> from an existing auto-created gke-<cluster>-* rule.
gcloud compute firewall-rules create allow-speedscale-webhook \
  --network=<NETWORK> --direction=INGRESS --action=ALLOW \
  --rules=tcp:9443 --source-ranges=<MASTER_CIDR> --target-tags=<TARGET_TAGS>
```

Egress from a private GKE cluster additionally needs Cloud NAT (or another egress
path) plus, if they use FQDN egress policies, the Step-1 host list.

### EKS / VPC on AWS

- Security groups are stateful; default SGs already allow all egress. Only emit SG
  rules if theirs restrict outbound: allow TCP 443 to `0.0.0.0/0`, or scope via a
  domain-filtering layer.
- Restricted-egress VPCs: private subnets need a NAT gateway; if AWS Network
  Firewall (or Squid/etc.) filters egress, give a TLS-SNI allowlist rule group with
  the Step-1 hostnames (`.s3.us-east-1.amazonaws.com` as a wildcard suffix).
- Remind: Speedscale's endpoints are in **us-east-1**; a same-region S3/STS VPC
  endpoint does not cover them unless the cluster is itself in us-east-1 (there,
  S3/STS/SQS/SNS/monitoring interface+gateway endpoints can keep traffic private).
- Custom NACLs: outbound 443 + inbound ephemeral 1024–65535 return traffic.

### AKS / Azure

`outboundType: userDefinedRouting` usually means Azure Firewall: emit an application
rule collection with the Step-1 FQDNs over `https:443` (application rules do SNI
filtering; avoid network rules + IPs).

### Corporate proxy / TLS inspection

- Speedscale components honor standard `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` env
  vars — show a Helm values snippet setting them on operator/forwarder rather than
  hand-editing deployments.
- TLS-inspecting (MITM) proxies re-sign with a corporate CA: either exempt the
  Step-1 hosts from inspection (preferred) or mount the corporate CA bundle into the
  Speedscale pods. Flag this explicitly whenever the probe showed an unexpected
  certificate issuer.

### NetworkPolicy / Cilium / mesh

- Default-deny NetworkPolicy: plain K8s NetworkPolicy can't match FQDNs — with
  Cilium emit a `CiliumNetworkPolicy` using `toFQDNs` with the Step-1 hosts (plus
  `matchPattern: "*.s3.us-east-1.amazonaws.com"`); with plain netpol, an egress
  allowance on 443 for the `speedscale` namespace plus DNS (53) to kube-dns.
- Istio with `outboundTrafficPolicy: REGISTRY_ONLY`: emit `ServiceEntry` resources
  for the Step-1 hosts.
- Don't forget in-cluster: the API server → operator 9443 path and (if default-deny
  covers the speedscale namespace) forwarder ↔ sidecar traffic.

### Workstation / CI (`speedctl`, `proxymock`)

Only the outbound host list on 443 applies. For CI, that's an egress allowlist entry
in whatever controls the runners; no inbound or webhook rules.

## Step 5 — Close the loop

After the user applies rules, re-run the Step-3 probes and report OK/FAIL per host.
If anything still fails, diff the failure mode (timeout vs DNS vs TLS) against the
scenario table and iterate. Never declare it fixed without a passing probe.
````
