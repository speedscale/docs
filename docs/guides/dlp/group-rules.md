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

## The baseline rule and `SPEEDSCALE_DLP_CONFIG`

`SPEEDSCALE_DLP_CONFIG` is a forwarder setting that names **one** DLP rule, by its id, for the whole install.
That rule is the **baseline**: it applies to every request the forwarder captures, whichever workload produced
it. This is how DLP has always been configured, and group rules do not change it.

You set it at install time through Helm values:

```yaml
dlp:
  enabled: true     # redaction on or off
  config: standard  # the id of the rule to apply
```

or afterwards in the dashboard, under **Infrastructure → your forwarder → Redaction rule**. Either way the
operator ends up holding the same two keys:

```yaml
SPEEDSCALE_DLP_CONFIG: standard
WITH_DLP: "true"
```

`standard` here is not a filename or a keyword — it is the `id` of a DLP rule, the same id that appears inside
the rule document itself:

```json
{
  "id": "standard",
  "name": "standard",
  "redactlist": {
    "entries": { "all": ["authorization", "password", "ssn"] }
  }
}
```

That is the whole linkage: the setting holds an id, and the rule with that id is fetched and applied to
everything. `WITH_DLP` (Helm: `dlp.enabled`) turns redaction off without discarding the selection, so you can
disable redaction without losing which rule you had chosen. Changing either value restarts the forwarder.

### What the setting does and does not select

- **It selects the baseline** — one rule, applied to all captured traffic.
- **It does not list group rules.** Group rules appear nowhere in the forwarder's configuration. They apply
  because their scope matches the traffic, so you never edit `SPEEDSCALE_DLP_CONFIG` to add a group's rule.
  Adding a group means publishing a rule, not changing a setting.
- **A scoped rule used as the baseline loses its scope.** If you point `SPEEDSCALE_DLP_CONFIG` at a rule that
  has a `scope`, that rule is applied install-wide like any other baseline. Name an unscoped rule here.

If your install has no baseline worth keeping, you can leave `SPEEDSCALE_DLP_CONFIG` on a small
organization-wide rule and let group rules carry the rest. What you should not do is delete the baseline and
assume group rules cover everything: traffic no group rule scopes is redacted by the baseline alone.

## How a group rule differs from a baseline rule

| | Baseline rule | Group rule |
|---|---|---|
| Selected by | `SPEEDSCALE_DLP_CONFIG` on the forwarder (see above) | nothing — it applies because of its scope |
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

### A worked example

An install with one baseline and two group rules:

```yaml
# forwarder setting
SPEEDSCALE_DLP_CONFIG: standard
WITH_DLP: "true"
```

```json
// rule id "standard" — the baseline, no scope
{
  "id": "standard",
  "redactlist": { "entries": { "all": ["authorization", "password"] } }
}

// rule id "payments" — a group rule
{
  "id": "payments",
  "owner": "payments-group",
  "enabled": true,
  "scope": { "namespaces": ["payments"] },
  "redactlist": { "entries": { "all": ["cardnumber"] } }
}

// rule id "search" — another group rule
{
  "id": "search",
  "owner": "search-group",
  "enabled": true,
  "scope": { "namespaces": ["search"] },
  "redactlist": { "entries": { "all": ["querytoken"] } }
}
```

What each workload gets:

| Traffic from | Redacted fields | Why |
|---|---|---|
| `payments` namespace | `authorization`, `password`, `cardnumber` | baseline plus the `payments` rule |
| `search` namespace | `authorization`, `password`, `querytoken` | baseline plus the `search` rule |
| any other namespace | `authorization`, `password` | baseline only — no group rule scopes it |
| traffic with no namespace | `authorization`, `password` | baseline only — see below |

Note that `SPEEDSCALE_DLP_CONFIG` still names only `standard`. Nothing about it changes when the `payments` or
`search` rule is added, edited or turned off.

### Traffic that cannot be attributed

A scope matches on the workload a request came from. Traffic Speedscale cannot attribute to a namespace or
service — for example, traffic recorded outside a cluster — matches **no** group rule and receives only the
baseline. This is deliberate: unlabelled traffic must not inherit another group's rules by accident. It also
means the baseline is what protects anything your group rules do not cover.

## Editing rules in proxymock web

proxymock web is where group rules are authored today. Rules live in the workspace
(`proxymock/dlprules/<id>.json`), so they travel with the repository and are the same documents
`proxymock cloud push/pull dlp` moves.

Open **DLP Rules** in the Config section of the sidebar.

### The rule list

Each row shows the rule id, its owner and what it covers, so you can tell your rule from another group's at a
glance:

```
payments
payments-group · payments

search
search-group · search, query

standard
2026-09-17 20:01
```

A rule with a scope that is not enabled is marked `off`. A rule with no scope, like `standard` above, shows no
coverage line — it is a baseline rule.

### Creating and editing

**+ New** starts a rule from a template that is already a group rule: scoped to one namespace, `enabled` set to
`false`, and an empty `owner` for you to fill in.

```json
{
  "id": "payments",
  "name": "payments",
  "owner": "",
  "enabled": false,
  "scope": { "namespaces": ["my-namespace"] },
  "redactlist": { "entries": { "all": ["authorization", "email", "password"] } },
  "discoverPatterns": true
}
```

Edit the document on the **Rule** tab and press **Save**. Saving validates the rule the way the capture path
will use it, so a document that cannot build a redactor, or a `scope` that names nothing, is refused there and
then rather than failing later on a forwarder.

Delete the `scope`, `owner` and `enabled` fields to author a baseline rule instead.

### Testing against traffic

The **Test against traffic** tab runs the rule in your editor over the recordings in the workspace and reports
what it would redact. Nothing is modified.

Because locally recorded traffic has no namespace or service, use the **test as** fields beside the Test button
to present it as a workload in your scope:

```
test as   namespace: payments    service: checkout
```

Without this a scoped rule matches nothing and looks broken. Leave the fields empty when testing a baseline
rule.

**Apply → write redacted copies** writes redacted copies of the workspace recordings into a new results
directory. It is a way to inspect the outcome on real traffic — it does not deploy anything.

### Previewing what a cluster receives

Your rule is only part of what a forwarder runs. **Preview effective**, under the rule list, resolves the whole
set the way a cluster would: enter the baseline rule id (and optionally a cluster) and it lists every scoped
rule that would apply, with its owner and coverage.

```
Baseline standard + 2 scoped rules
payments   payments-group · payments
search     search-group · search, query
```

This is read-only. Use it to confirm your rule is included, and to see what is already being redacted, before
you change anything.

### Applying to a cluster

The **Settings** panel writes the forwarder configuration: **Redaction rule** (`SPEEDSCALE_DLP_CONFIG`) and
**Redact sensitive data** (`WITH_DLP`). Applying writes the resolved document — baseline plus the group rules
that cover the cluster — into the cluster, so the forwarder reads it directly instead of downloading a single
rule. This needs a connected cluster; without one the panel is read-only.

## Editing rules in the dashboard

The dashboard manages DLP rules under **DLP Rules**, and selects the baseline under **Infrastructure → your
forwarder → Redaction rule**. Both work as they always have for baseline rules.

:::warning
The dashboard does not yet understand `scope`, `owner` or `enabled`.

- Pasting a rule containing those fields into the **Advanced** JSON tab is rejected with an unknown-field error.
- Opening an existing group rule in the dashboard editor and saving it **silently drops** those three fields,
  turning it back into an unscoped rule.

Until the dashboard is updated, manage group rules in proxymock web, and use the dashboard for baseline rules
and for choosing which rule `SPEEDSCALE_DLP_CONFIG` names.
:::

Cloud-side assembly is also not wired up yet: a scoped rule pushed to Speedscale Cloud is not combined into a
resolved document there. If you point `SPEEDSCALE_DLP_CONFIG` at a scoped rule, the forwarder downloads it and
applies it like any baseline — scope and all its restraint ignored — so redaction lands on every workload. Apply
group rules from proxymock web instead.

## Which surface does what

| Task | proxymock web | Dashboard |
|---|---|---|
| Create or edit a baseline rule | yes | yes |
| Create or edit a group rule (scope, owner, enabled) | yes | not yet |
| Test a rule against recorded traffic | yes, with a workload override | via snapshots |
| Preview the resolved rule set for a cluster | yes | not yet |
| Choose which rule `SPEEDSCALE_DLP_CONFIG` names | yes, in Settings | yes, in Infrastructure |
| Apply the resolved document to a cluster | yes | not yet |

## Authoring checklist

1. **Start from your own traffic.** Follow [Discovering PII](./discovering-pii.md) and
   [Recommendations](./recommendations.md) on a recording from your service.
2. **Create the rule** in proxymock web, fill in `owner`, and scope it to the workloads your group owns. Leave
   `enabled` at `false` while you work.
3. **Test it** with the **test as** fields set to a workload in your scope.
4. **Preview effective** to see your rule alongside the baseline and any other group's rules.
5. **Enable it** and apply the configuration to the cluster.
6. **Verify** with a snapshot: your fields redacted, other groups' traffic unchanged.

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
- **The dashboard cannot author group rules yet.** It drops `scope`, `owner` and `enabled` on save and rejects
  them in the JSON editor, so group rules are managed in proxymock web for now.
- **Rules are resolved where they are applied.** proxymock web assembles the document and writes it to the
  cluster. Speedscale Cloud does not assemble group rules, so a scoped rule named by `SPEEDSCALE_DLP_CONFIG` is
  downloaded and applied install-wide.
- **Scope names are exact.** There is no wildcard or label selector; list the namespaces and services you mean.

## Related documentation

- [Creating DLP Rules](./creating-rules.md) — the rule format and how to build one
- [Applying DLP Rules](./applying-rules.md) — getting a rule onto a forwarder
- [Best Practices](./best-practices.md) — DLP practices beyond multi-group management
- [Troubleshooting](./troubleshooting.md) — when redaction does not do what you expect
