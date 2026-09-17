---
sidebar_position: 7
title: DLP Rules for Multiple Groups
description: Scope DLP rules to the namespaces and services a group owns so several groups can manage redaction on one shared forwarder.
---

# DLP Rules for Multiple Groups

One forwarder usually captures traffic for many groups. If every group edits the same DLP rule, they take turns
editing one JSON document: changes collide, a careless save removes another group's redaction, and nobody can
tell which group asked for which field.

**Group rules** solve this. A group rule is an ordinary DLP rule that also names the workloads it covers. Each group
keeps its own rule, and a rule redacts only the traffic it names.

A "group" is whatever unit owns redaction in your organization — a team, a product, a business unit, a
compliance domain. Speedscale does not impose a structure: a group is simply a name you put on a rule and the
set of workloads you scope it to.

## How a group rule differs from a baseline rule

| | Baseline rule | Group rule |
|---|---|---|
| Selected by | `SPEEDSCALE_DLP_CONFIG` on the forwarder | nothing — it applies because of its scope |
| Covers | every workload the forwarder captures | only the clusters, namespaces and services it names |
| Owned by | whoever administers the install | one group |
| Typical content | organization-wide fields (`authorization`, `ssn`) | fields specific to that group's APIs |

You do not have to choose one or the other. The rule named by `SPEEDSCALE_DLP_CONFIG` stays the baseline for
every workload, and group rules add redaction on top of it for their own traffic.

## Anatomy of a group rule

Three fields turn a DLP rule into a group rule:

```json
{
  "id": "payments",
  "name": "payments group redaction",
  "owner": "payments-group",
  "enabled": true,
  "scope": {
    "namespaces": ["payments", "payments-canary"],
    "services": ["checkout"]
  },
  "redactlist": {
    "entries": { "all": ["cardnumber", "cvv"] }
  }
}
```

- **`scope`** names the workloads the rule covers. Each dimension (`clusters`, `namespaces`, `services`) is a
  list of exact names. A dimension you leave out means "any".
- **`owner`** records the group that maintains the rule — any name your organization recognizes. It is a label
  today, shown in the rule list and attached to redactions the rule performs.
- **`enabled`** decides whether the rule participates at all. New rules start disabled so a half-written rule
  never redacts production traffic before its author has looked at it.

The example covers the `checkout` service in the `payments` and `payments-canary` namespaces, in any cluster.

:::note
A `scope` that names nothing is rejected when you save. A rule that applies everywhere is the baseline's job;
an empty scope would quietly redact every other group's traffic.
:::

## How rules combine

When a forwarder asks for its DLP configuration, Speedscale assembles one document:

1. the baseline rule named by `SPEEDSCALE_DLP_CONFIG`, applied to all traffic, then
2. every enabled group rule whose scope covers that cluster, each applied only to the traffic it scopes.

Rules are combined in a fixed order (by rule id), so the same set of rules always produces the same
configuration.

Redaction is **additive**. A group rule can only redact more than the baseline for its own workloads. It cannot
switch off the baseline, and it cannot reach traffic outside its scope. Two groups that share a namespace both
apply, and neither needs to see the other's rule.

### Traffic that cannot be attributed

A scope matches on the workload a request came from. Traffic Speedscale cannot attribute to a namespace or
service — for example, traffic recorded outside a cluster — matches **no** group rule and receives only the
baseline. This is deliberate: unlabelled traffic must not inherit another group's rules by accident. It also
means the baseline is what protects anything your group rules do not cover.

## Authoring a group rule

1. **Start from what your traffic contains.** Follow [Discovering PII](./discovering-pii.md) and
   [Recommendations](./recommendations.md) on a recording from your own service.
2. **Create the rule** as described in [Creating DLP Rules](./creating-rules.md), then add `owner` and `scope`.
   Leave `enabled` set to `false` while you work.
3. **Test it against real traffic** before enabling it (see below).
4. **Enable it**, then apply the configuration to the cluster as described in
   [Applying DLP Rules](./applying-rules.md).
5. **Verify** by taking a snapshot and confirming your fields are redacted and that other groups' traffic is
   unchanged.

### Testing a scoped rule locally

In proxymock web, the DLP editor tests the rule in your editor against the traffic in your workspace.

Locally recorded traffic has no namespace or service of its own — it never went through a pod — so a scoped rule
matches nothing by default and looks broken. Use the **test as** fields beside the Test button to present the
recorded traffic as a workload in your scope:

```
test as   namespace: payments    service: checkout
```

The test then reports what the rule would redact in that namespace. Leave the fields empty to test an unscoped
baseline rule.

:::tip
If a scoped rule reports zero redacted fields, check the **test as** values before changing the rule itself.
A mismatched namespace is the most common cause.
:::

### Previewing everything the cluster will receive

Your own rule is only part of what the forwarder runs. proxymock web can show the full assembled document —
baseline plus every enabled group rule that covers the cluster — so you can confirm your rule is present and see
what else is already redacted before applying anything.

## Best practices

**Scope to what your group owns.** Name your namespaces and services explicitly. A broader scope does not
protect more of your data; it just means your rule redacts other groups' traffic in ways they did not ask for.

**Keep the baseline small and organization-wide.** Credentials, authorization headers and government
identifiers belong in the baseline, because they are sensitive everywhere. Fields specific to one API belong in
that group's rule.

**Give every rule a real owner.** When redaction surprises someone six months later, `owner` is how they find
the group to ask.

**One rule per group, not one per field.** A group rule holds a list of fields; splitting it into many rules
multiplies what has to be reviewed with no benefit.

**Prefer adding to your own rule over editing the baseline.** Baseline changes affect everyone, and need the
agreement of everyone.

**Turn rules off rather than deleting them.** Setting `enabled` to `false` keeps the history of what you used
to redact, which matters during an audit.

**Review scopes when you rename a namespace or service.** A scope names workloads exactly. Renaming a namespace
silently takes the rule out of service, and the traffic falls back to the baseline alone.

**Check coverage after onboarding a new service.** A new service in a namespace nobody scoped receives only the
baseline. Take a snapshot and confirm its fields are redacted as you expect.

**Do not put secrets in a rule.** A DLP rule names the fields to redact. It should never contain an example of
the sensitive value itself.

## Current limitations

- **Ownership is advisory.** `owner` records which group maintains a rule; it does not yet stop another group from
  editing it. Rules are per-group documents, so access controls attach to them when that capability lands.
- **Rules are resolved where they are applied.** Group rules assembled by proxymock web are written to the
  cluster when you apply them. Managing the same rule set from Speedscale Cloud is a separate step.
- **Scope names are exact.** There is no wildcard or label selector; list the namespaces and services you mean.

## Related documentation

- [Creating DLP Rules](./creating-rules.md) — the rule format and how to build one
- [Applying DLP Rules](./applying-rules.md) — getting a rule onto a forwarder
- [Best Practices](./best-practices.md) — DLP practices beyond multi-group management
- [Troubleshooting](./troubleshooting.md) — when redaction does not do what you expect
