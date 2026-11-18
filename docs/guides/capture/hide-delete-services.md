---
title: Hide or delete a service
description: "Clear retired test systems out of the Speedscale dashboard. Hide a service from the service lists for your whole team, or permanently delete the traffic Speedscale captured from it."
sidebar_position: 6
---

# Hide or delete a service

Every service Speedscale has captured traffic from stays in the service lists, so old test systems pile up over time. You have two ways to clear them out:

| | Hide | Delete service data |
|---|---|---|
| What it does | Takes the service out of the default lists | Permanently deletes its captured traffic, then hides it |
| Can be undone | Yes, unhide it any time | No |
| Snapshots and reports | Kept | Kept, unless you choose to delete the snapshots that hold only this service |
| Who can do it | Maintainers and admins | Admins |

Both apply to the whole tenant: everyone on your team stops seeing the service. A service is identified by its name, so hiding or deleting it covers every cluster and namespace it ran in.

## Hide a service

On the **Services** page, open the **⋮** menu at the end of the service's row and select **Hide service**. You can also use the **⋮** menu in the header of the service's own page. Select **Undo** in the confirmation to bring it straight back.

A hidden service is left out of:

- the **Services** list and its count
- the services on **Home**
- the service filter on **Traffic** and the service picker in schedule forms
- the service map
- the weekly admin digest

Nothing is deleted. Its traffic, snapshots, and reports stay where they are, and a link to the service's page or a traffic filter that names it still works. The service's page shows a banner while it is hidden.

A hidden service that sends new traffic stays hidden. In the hidden list it is marked **New traffic**, because it may still be in use.

### See and unhide hidden services

When anything is hidden, the **Services** page shows a **Show hidden** switch with the number of hidden services. Turn it on to list them, dimmed and marked **Hidden**. To put one back, open its **⋮** menu and select **Unhide service**, or select **Unhide service** in the banner on its page.

## Delete a service's data

Admins can permanently delete the traffic Speedscale captured from a service. Open the service's **⋮** menu and select **Delete service data...**. Before anything is deleted, the dialog shows:

- how many captured requests will be deleted, and from how many cluster and namespace registrations
- how many snapshots hold only this service, with their reports
- how many snapshots are kept because they are locked or also hold other services

Snapshots and reports are kept by default. To delete the snapshots that hold only this service, along with their reports, select the **Also delete** checkbox. Locked snapshots and snapshots that hold other services are never deleted this way.

Type the service name and select **Delete**. The service is hidden right away and its traffic is deleted in the background. The delete is recorded in the activity feed when it starts and again when it finishes.

:::caution
Deleting service data cannot be undone. If the service is still being captured, new traffic keeps arriving and is kept, and the service stays hidden. Stop capturing it first if you want it gone for good.
:::

Raw capture files in storage expire on their normal schedule; once the delete finishes, nothing in Speedscale reads them. See [Data Retention](../../reference/data-retention.md).

## From speedctl

List services, including hidden ones:

```bash
speedctl get services --include-hidden
```

Hide or unhide one or more services:

```bash
speedctl hide service old-test-api legacy-mock --reason "retired test systems"
speedctl unhide service old-test-api
```

Delete a service's data. Without `--yes`, the command only prints what it would delete:

```bash
speedctl delete service old-test-api
speedctl delete service old-test-api --include-snapshots --yes
```

The same roles apply: `hide` and `unhide` need maintainer or admin, and `delete service` needs admin. API keys for service accounts cannot run them.
