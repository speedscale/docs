---
description: "Explore the Speedscale Dashboard to replay recorded traffic, configure settings, and view detailed reports for effective API testing and traffic management"
sidebar_position: 1
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Dashboard

## Run your first dashboard replay

Once your service has recorded traffic, open a snapshot and select **Replay** at the top right. The **Replay** button in the Traffic viewer opens the same page for the traffic you selected.

![The Overview of a snapshot, with the Replay button at the top right](./replay-button.png)

Start with a saved snapshot, choose the requests and mocks to use, and follow the run to its report.

<video controls playsInline preload="none" aria-label="Run your first dashboard replay" style={{width: '100%', maxWidth: 800, aspectRatio: '16 / 9'}}>
  <source src={useBaseUrl('/videos/guides/speedscale-first-dashboard-replay.mp4')} type="video/mp4" />
  <track kind="captions" src={useBaseUrl('/videos/guides/speedscale-first-dashboard-replay.en.vtt')} srcLang="en" label="English" />
  <a href={useBaseUrl('/videos/guides/speedscale-first-dashboard-replay.mp4')}>Download the video</a>
</video>

The replay page shows the snapshot's service dependency map above numbered steps.

1. Select the **cluster** where the replay will run, then the **namespace** that holds a copy of your service. This may be the workload where the traffic was recorded, or a newer version of the same application you want to test against.

![Step 1 of the replay page, with the dev-decoy cluster selected and the banking-replay namespace](./replay-wizard-cluster.png)

2. Select the type of test. **API Contract and Correctness** offers regression tests at 1x traffic, with or without service mocks. **Performance and Stress** offers load tests. **Custom Scenario** uses a test config you choose. If you are unsure, start with a regression test.

![Step 2 of the replay page, with Custom Scenario selected and the banking-gateway-regression test config](./replay-wizard-config.png)

3. Choose where to send traffic. Each inbound traffic source holds the requests replayed against your service. Include or exclude it, and use the pencil to change its target.

![Step 3 of the replay page, with one inbound source for banking-gateway sent to http://banking-gateway:80](./replay-wizard-inbound.png)

4. Attach mock services. Each outbound dependency is answered by a mock instead of your real dependency. Include or exclude it, and use the pencil to change which workload the mock attaches to.

![Step 4 of the replay page, with mocks for banking-transactions, banking-accounts and banking-user attached to the banking-gateway deployment](./replay-wizard-outbound.png)

5. Optionally add a **build tag** to identify the version under test.

6. **Authentication & Resigning** lists the JWTs in the recorded traffic and when they expire. Choose how to handle expired tokens, then select **Start Replay**. **Run In Terminal** shows the same replay as a `speedctl` or `proxymock` command you can run locally or in CI.

![Step 6 of the replay page, with the JWT locations, the resigning options, the Start Replay button and the Run In Terminal command](./replay-wizard-start.png)

## Replay traffic your service sent {#replay-outbound}

By default a replay sends your service's inbound traffic to it and mocks everything it calls. To test a dependency instead, such as the database your service uses, open the snapshot's **Traffic** tab and select **Choose replay tests**. Pick the dependency under **Outbound dependencies** and save. The snapshot is reanalyzed and the dependency becomes a service you can replay against. See [Choose What a Replay Tests](../../proxymock/guides/choose-replay-tests.md) and [Load and Regression Test a Database](../../proxymock/databases/load-and-regression-testing.md).

## Replace expired credentials {#replace-credentials}

If your service checks tokens, the recorded ones have probably expired, and replayed requests would get 401s. Open the snapshot's **Prepare** tab and select **Replace credentials** on the credential's row before you replay, so every replay of that traffic sends valid credentials. See [Replace Recorded Credentials](./replace-credentials.md).

## View Report

Once the replay is started you will be redirected to the replay report.  The page will automatically update as the report is run, eventually showing a summary of the replay.

![The Overview of a passed replay report, with the replay progress and the Completed, Accuracy, Mocks and Goals checks](./replay-report.png)

You can also access the report later from the reports page.

