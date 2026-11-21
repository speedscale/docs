---
sidebar_position: 7.2
title: Managing Group Rules in the Dashboard
description: Create and edit scoped DLP group rules in the Speedscale dashboard, and understand when a saved rule reaches your forwarders.
---

# Managing Group Rules in the Dashboard

The dashboard edits the DLP rules stored in Speedscale Cloud. Once a group rule is saved and enabled there, the cloud combines it with the baseline and delivers it to every cluster it covers; nobody has to change a forwarder setting.

This page is the how-to. For what a group rule is, how it relates to the baseline named by `SPEEDSCALE_DLP_CONFIG`, and how rules combine, read [DLP Rules for Multiple Groups](./group-rules.md) first. To author and test rules against local recordings, see [Managing Group Rules in proxymock web](./group-rules-proxymock.md).

:::info Requirements
Editing DLP rules in the dashboard requires the **admin** role. Other roles see which rules mask a service, but not the actions that change them.
:::

## Find a rule

Open **DLP Rules** and pick a rule from **DLP rule ID**. Two banners sit above the editor.

![A group rule in the dashboard: the cluster-usage banner, the summary line, and the Scope tab](./dashboard-dlp-scope-tab.png)

- **The summary line** says what the rule is: a baseline that applies to all captured traffic, or a group rule with
  its owner and the workloads it covers.
- **The cluster-usage banner** counts the clusters whose forwarder names this rule in `SPEEDSCALE_DLP_CONFIG`: the clusters using it as their **baseline**. A group rule is never named there, so it shows **0 clusters** even while it redacts traffic. That is expected; the summary line and its scope tell you where a group rule applies.

A group rule that is switched off says so in its summary line:

![Summary line for a disabled group rule: "Turned off: it redacts nothing until enabled."](./dashboard-dlp-summary-off.png)

## Create a group rule

1. Click **Create DLP rule** and enter an id, for example `payments`.
2. Open the **Scope** tab and choose **Group rule** under **Rule type**. A rule switched to a group rule starts
   disabled, so it cannot touch production traffic while you are still writing it.
3. Fill in **Owner** with your group's name: a team, product, business unit or compliance domain.
4. Name the workloads the rule covers in **Clusters**, **Namespaces** and **Services**. A field you leave empty
   matches anything, but at least one must name something.
5. List the field and header names to mask on the **Mask fields by name** tab, add transform chains on the **Transformations** tab, or both. See [Masking Fields by Name](./creating-rules.md#masking-fields-by-name).
6. Turn on **Enabled** when you are ready, and click **Save**.

## Add a service to a rule from where you find it

You do not have to open the rule editor to put a service in a group rule's scope. Each place below opens the same **Add to DLP rule** dialog, with the service and the clusters and namespaces it runs in already filled in.

| Where | What to click |
|---|---|
| A service's page under **Services** | **Add to DLP rule** in the **DLP rules** section, or in the page's actions menu |
| The **Services** list | The row's actions menu, then **Add to DLP rule** |
| **Infrastructure**, a cluster's **Workloads** | Open a workload, then **Add to DLP rule** on its **Capture** tab |
| A request's **Info** tab in **Traffic** | **Add *service* to a DLP rule**, next to the **DLP Rule** row |

### See which rules mask a service

The service page's **DLP rules** section lists, for each cluster and namespace the service runs in, the cluster's baseline and every group rule whose scope matches the service, on or off. The section also says when a cluster's redaction settings leave a gap. With no baseline named and **Redact sensitive data** (`WITH_DLP`) off, no rule masks the service's traffic there, group rules included. With a baseline named but **Redact sensitive data** off, the forwarder still runs the rules' transform chains but masks none of the fields listed under **Mask fields by name**. The **Capture** tab of a workload says the same thing in one sentence.

### Pick a rule and check the change

1. Under **Where**, untick any cluster and namespace the rule should not cover.
2. Pick a group rule under **Rule**. Each one shows its owner and what it covers now. Baselines are not offered, because a baseline already applies to everything its cluster captures.
3. Read the preview. It shows the rule's scope lists after the change, with the added values marked, and **Also masks**: running workloads the change would start masking that you did not ask for.
4. Save.

The preview exists because of how a scope matches. A scope covers every combination of the clusters, namespaces and services it lists, so adding a service from a namespace the rule does not name also adds that namespace, and the namespace pairs with every service the rule already lists. When the dialog finds other running workloads in those combinations, it offers two choices:

- **Add to *rule*** is selected by default. It widens the original rule, and the preview lists what it starts masking.
- **Create a copy that covers only *service*** saves a new rule with the same masking and owner, scoped to just this service. Later edits to one rule do not reach the other.

If a cluster does not answer, the preview says it could not check that cluster and treats the change as one that may widen the rule. A rule that already covers the service says so and saves nothing. **New group rule** creates a rule that is off, with the scope filled in and nothing to mask yet, and opens it on the **Mask fields by name** tab. Adding a service to a rule that is off saves the scope but does not turn the rule on.

### Remove a service from a rule

On the service page, each group rule has an actions menu with **Remove *service* from this rule**. Two cases are refused, with a link to the rule's **Scope** tab instead:

- The service is the only one the rule lists. Removing it would leave **Services** empty, which matches any service, so the rule would start masking every workload in its clusters and namespaces.
- The rule lists no services, so it covers the service through its clusters or namespaces.

## The Scope tab

The **Scope** tab holds everything that makes a rule a group rule.

| Control | What it sets |
|---|---|
| **Rule type** | *Baseline* applies to all captured traffic. *Group rule* applies only to the workloads named below, on top of the baseline. |
| **Owner** | The `owner` field: which group maintains the rule. |
| **Enabled** | The `enabled` field. While off, the rule redacts nothing. |
| **Add services** | Opens a picker of the services running now. Choose a cluster, a namespace and services, and all three scope fields fill in at once, with the same **Also masks** preview as the Add to DLP rule dialog. Nothing is saved until you click **Save**. |
| **Clusters**, **Namespaces**, **Services** | The rule's `scope`. Each accepts several values. |
| **Covers now** | The running workloads the rule matches as written, looked up in the namespaces it names. |

### Suggestions come from what is running now

The scope fields suggest names from your live infrastructure (the same lists the **Infrastructure** pages show), not from every name that has ever appeared in recorded traffic:

- **Clusters** suggests the connected clusters.
- **Namespaces** suggests the namespaces in the clusters the rule names, or in every connected cluster if it names
  none.
- **Services** suggests the workloads running in the namespaces the rule names. Name a namespace first to see them, or use **Add services** to pick a cluster, namespace and service together.

![Services suggestions for the payments namespaces: checkout, ledger and refunds](./dashboard-dlp-scope-suggestions.png)

Every field also accepts a name that is not running yet, so you can scope a rule before a service is deployed. A service is matched against each pod's `app` label, which is usually the workload name.

### Save is refused for an empty scope

A group rule whose scope names nothing is refused, with the message *Name at least one cluster, namespace or service*. A rule that applies everywhere is what the baseline is for; an empty scope would redact every other group's traffic. The check applies on the Advanced tab too, where Save looks at the JSON exactly as typed.

## Editing on the Advanced tab

The **Advanced** tab holds the whole rule as JSON, including `scope`, `owner` and `enabled`:

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
  "redactlist": { "entries": { "all": ["cardnumber", "cvv"] } }
}
```

Edits carry over when you switch tabs: a change typed here shows up on the Scope and Transformations tabs, and the other way round. If the JSON does not parse when you leave the tab, you are asked before it is discarded.

## Baseline rules

A rule whose **Rule type** is *Baseline* has no scope, owner or enabled switch. Whichever baseline a forwarder runs is chosen per cluster under **Infrastructure → your forwarder → Redaction rule**, which sets `SPEEDSCALE_DLP_CONFIG`. Rules maintained by Speedscale, such as `standard`, are read-only; copy one with **Copy DLP rule** to change it.

:::warning
Do not point **Redaction rule** at a group rule to make it apply. The forwarder treats whatever that setting names as the baseline and ignores its scope, so the rule's redaction lands on every workload.
:::

## When a saved rule takes effect

Saving an enabled group rule is all it takes:

1. Speedscale Cloud combines each cluster's baseline with every enabled group rule that covers it.
2. It tells every connected cluster to reload its DLP rules. Each forwarder resolves its own set again, so only
   clusters the rule covers end up redacting differently.
3. Each forwarder restarts to pick up its rules, which briefly pauses capture. Because the reload is not limited to
   the clusters a rule covers, batch your edits rather than saving many small changes during busy periods.

Editing or disabling a group rule works the same way, and `SPEEDSCALE_DLP_CONFIG` does not change at any point.

:::caution Deleting a rule
Deleting a rule does not tell clusters to reload, so forwarders keep redacting with it until they next restart. To retire a group rule, turn **Enabled** off and save first (that change is delivered), then delete it.
:::

If a cluster has a rule applied directly from proxymock web (the `speedscale-forwarder-dlp` ConfigMap), its forwarder uses that document and ignores the cloud until the ConfigMap is removed.

## Limitations

- **The rule list shows ids only.** Owner and coverage appear in the summary line once a rule is open, and in the **Add to DLP rule** dialog.
- **No preview of the resolved rules.** A service's page shows which rules match each place it runs, and **Covers now** lists the workloads a rule matches, but the dashboard cannot show the whole document a cluster receives. Use [Preview effective](./group-rules-proxymock.md#preview-what-a-cluster-receives) in proxymock web.
- **Ownership is advisory.** `owner` records who maintains a rule; any admin can still edit it.

## Related documentation

- [DLP Rules for Multiple Groups](./group-rules.md): the model: baseline, scope, owner and how rules combine
- [Managing Group Rules in proxymock web](./group-rules-proxymock.md): author and test rules against recordings
- [Applying DLP Rules](./applying-rules.md): choosing a forwarder's baseline
