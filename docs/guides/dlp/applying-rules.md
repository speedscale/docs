---
sidebar_position: 6
title: Applying Rules to Production
description: Point a forwarder at a DLP rule, roll it out from a test cluster to production, and confirm that captured traffic is masked.
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Applying Rules to Production

A DLP rule masks traffic once a forwarder applies it. Each forwarder applies one **baseline** rule to everything it captures, plus any [group rules](./group-rules.md) whose scope covers its cluster. This page covers the baseline. Group rules need no forwarder setting: they apply because of their scope.

Masking happens in your cluster, before captured traffic is sent to Speedscale cloud. It applies to traffic captured from then on. Snapshots captured earlier are not changed.

## Check the Rule Before Rollout

Test a rule on representative traffic before it reaches production. The video shows a rule tested on synthetic traffic, with the original and masked payloads compared side by side.

<video controls playsInline preload="none" aria-label="Verify redaction before enabling a DLP rule" style={{width: '100%', maxWidth: 800, aspectRatio: '16 / 9'}}>
  <source src={useBaseUrl('/videos/guides/speedscale-verify-dlp-redaction.mp4')} type="video/mp4" />
  <track kind="captions" src={useBaseUrl('/videos/guides/speedscale-verify-dlp-redaction.en.vtt')} srcLang="en" label="English" />
  <a href={useBaseUrl('/videos/guides/speedscale-verify-dlp-redaction.mp4')}>Download the video</a>
</video>

To test against your own recordings, `proxymock dlp test` previews what a rule changes. See [Author DLP and Filter Rules Locally](/proxymock/guides/local-rules.md).

## Select the Rule for a Forwarder

Two forwarder settings control DLP:

| Setting | Helm value | Meaning |
|---------|------------|---------|
| `SPEEDSCALE_DLP_CONFIG` | `dlp.config` | The id of the baseline rule. |
| `WITH_DLP` | `dlp.enabled` | Turns masking on or off without forgetting which rule is selected. |

In the dashboard, open **Infrastructure**, select the forwarder, and set **Redaction rule**. Or set the Helm values at install time:

```yaml
dlp:
  enabled: true
  config: payments-pii
```

Changing either setting restarts the forwarder. Editing the rule itself does not: save it in the dashboard or push it with [speedctl](./cli-reference.md), and forwarders that use it pick up the change.

Name a rule without a scope as the baseline. A forwarder applies its baseline to all traffic and ignores any scope on it, so a group rule chosen here would mask every workload.

## Roll Out

1. Apply the rule to a forwarder in a test cluster.
2. Send traffic that contains the fields you mask, and create a snapshot.
3. Check the snapshot: masked fields show `REDACTED-` tokens, and fields you did not mask are unchanged.
4. Apply the same rule to the production forwarder.
5. Create a production snapshot and check it the same way.

## Confirm Masking

Open an RRPair in **Traffic** or in a snapshot and look for `REDACTED-` values where the sensitive data was. An RRPair that DLP changed shows the id of the rule that masked it, and the id links to the rule.

If a field is still visible, see [Troubleshooting](./troubleshooting.md).

## Next Steps

- [DLP Rules for Multiple Groups](./group-rules.md): let each group mask its own workloads on a shared forwarder.
- [Generating Test Data](./test-data-generation.md): replace `REDACTED-` tokens before replay.
