import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Tutorial

In this guide we're going to use [this repo's](https://github.com/speedscale/demo) example app in the `java` directory to [capture](./concepts/capture.md), [transform](./concepts/transforms.md) and [replay](./concepts/replay.md) traffic with [mocks](./concepts/service_mocking.md).

## Prerequisites

1. [Speedctl is installed](./setup/install/cli.md)
2. Clone https://github.com/speedscale/demo
3. [Java](https://jdk.java.net/) is present
4. Make sure `JAVA_HOME` is set correctly (on MacOS you can run `/usr/libexec/java_home` to find the correct `JAVA_HOME`)
5. Install `jq` and `make` if not already on your desktop (`brew install jq` and `brew install make` on MacOS for example)

## The App

The app is a Java Spring Boot web server with authenticated endpoints that makes requests out to a few external services. The project README (at `java/README.md`) shows ways to run the app locally, in Docker and in Kubernetes. Speedscale can be configured to be compatible with whichever way you choose to deploy the app. Note that for this test run we'll disable DLP but you can find instructions on how to enable it near the end.

## Capture

Make sure you navigate to the `java` subdirectory within the `demo` repository.

<Tabs>

<TabItem value="Kubernetes">

1. [Install the operator](./setup/install/kubernetes-operator.md)
2. Run:

```bash
make kube-capture
```

This should start generating traffic that you can see in the Speedscale UI within a couple of minutes.

</TabItem>

<TabItem value="Docker">

1. Generate a jks for the Java app:

```bash
docker run --rm -v ~/.speedscale/certs:/speedscale openjdk bash -c 'keytool -importcert -noprompt -cacerts  -storepass changeit  -alias speedscale -file  /speedscale/tls.crt && cp ${JAVA_HOME}/lib/security/cacerts /speedscale/cacerts.jks'
```

2. Run:

```bash
speedctl install
```

Choose the `Docker` option and then the `Capture` option (option 1). You can name the service anything you want, the default port setting of `8080` is necessary.

3. Run the following to bring up the Speedscale capture components:

```bash
docker compose --file speedscale-docker-capture.yaml up -d
```

4. Run in your current terminal window:

```bash
make compose-capture
```

5. Open a new terminal window and run:

```bash
make client-capture
```

This should start generating traffic that you can see in the Speedscale UI within a couple of minutes.

</TabItem>

<TabItem value="Local">

1. Generate local certs by running the following command:

```bash
speedctl create certs --jks --output-dir ~/.speedscale/certs
```

2. Run in a separate terminal window:

```bash
speedctl capture java-server 8080
```

3. Run in your original terminal window:

```bash
make local-capture
```

4. Run

```bash
make client-capture
```

This should start generating traffic that you can see in the Speedscale UI within a couple of minutes.

</TabItem>

</Tabs>

## Analyze

<iframe src="https://player.vimeo.com/video/983558864" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
<p><a href="https://vimeo.com/983558864">Exploring Speedscale Traffic Viewer</a> from <a href="https://vimeo.com/speedscale">Speedscale</a> on <a href="https://vimeo.com">Vimeo</a>.</p>

After a few minutes you should be able to see your traffic in the [Speedscale dashboard](https://app.speedscale.com). Make sure to select the the same service name that you entered in `speedctl install` from the traffic dropdown. You should be able to see the inbound and outbound calls for this app as shown below.

![Traffic](./end-to-end/traffic.png)

You can also drill down into specific requests-response pairs (RRPairs). For eg. we see the request we make to our app to get the max interest rate for treasuries.

![Server](./end-to-end/server-request.png)

And we can also see the outbound request our app makes to the Treasury API to fulfill this request.

![Treasury](./end-to-end/out-request.png)

You can and inspect it further or you can skip ahead to running a replay which will also create a snapshot as a side effect.

## Replay

We're now going to run a replay for this captured traffic.

<Tabs>

<TabItem value="Kubernetes">

Click the `Replay as Tests/Mocks` button on the top right and walk through the wizard. All the default settings are ok here. You can also do this outside of the UI with more instructions [here](./guides/replay/kube.md).

</TabItem>

<TabItem value="Docker">

1. Click the `Save to Tests/Mocks` button in the top right. All the default settings are ok here. You can find more detailed instructions in the [Create a Snapshot](./guides/creating-a-snapshot.md) section.
2. Once you see the Snapshot summary, copy the snapshot ID from the URL or by clicking the `Copy Snapshot ID` option from the three dot menu.
3. Run:

```bash
speedctl install
```

Choose the `Docker` option and then `Replay` (option 3).

4. Select your service and the standard test config. Make sure you select the same service name you entered during the capture phase.
5. Input the Snapshot ID from step 1, the port should still be `8080`
6. Run in one terminal window:

```bash
make compose-replay
```

7. Run in another window to start the replay:

```bash
export TEST_REPORT_ID=$(uuidgen |  tr '[:upper:]' '[:lower:]'); docker compose --file speedscale-docker-replay.yaml up -d && echo "Your test report can be found at: https://app.speedscale.com/reports/${TEST_REPORT_ID}"
```

</TabItem>

<TabItem value="Local">

1. Click the `Save to Tests/Mocks` button in the top right. All the default settings are ok here. You can find more detailed instructions in the [Create a Snapshot](./guides/creating-a-snapshot.md) section.
2. Once you see the Snapshot summary, copy the snapshot ID from the URL or by clicking the `Copy Snapshot ID` option from the three dot menu.
3. Run:

```bash
make local-replay
```

4. Replace `SNAPSHOT_ID` and run:

```bash
speedctl replay SNAPSHOT_ID --test-config-id=standard  --custom-url='http://localhost:8080'
```

</TabItem>

</Tabs>

## Making sense of a Replay

If you are already viewing the Snapshot you recorded, you can see your replay appear in the `Replay` tab. Alternatively, you can find a report for your Replay in the [dashboard](https://app.speedscale.com/reports). It should look something like this.

![Report](./end-to-end/report.png)

We can see that all the requests our app makes to third party APIs were mocked out with 100% success rate. For eg. we can see the request our app made to the Treasury API that was actually mocked out which is great for isolation during tests but we can also do this for other parts of our development cycle as detailed [here](./guides/replay/mocks/README.md#responder-only).

![Responder](./end-to-end/mocks.png)

You can also see that the success rate isn't 100%. We can drill down into a specific assertion to see why.

![JWT](./end-to-end/jwt.png)

### Transform

The JWT we get from the login request is different which is expected. If we were replaying in a different environment, we might need different credentials entirely for the login request. Another pattern might be a set of traffic where we don't have a login request and instead we need to [resign the JWT](./reference/transform-traffic/common-patterns/guide-jwt.md) from our captured traffic. This is where [Transforms](./concepts/transforms.md) come into play and we can edit our captured data to parameterize parts of it. As an example, we can transform our snapshot to edit the password.

![Transform](./end-to-end/login-transform.png)

When you find the request in the transform editor, you can click the pencil icon next to the field you want to edit which in our case is the password.

![Transform](./end-to-end/login-transform-modal.png)

For now we'll just replace it with a constant but there are all sorts of options that can be chained together.

![Changed](./end-to-end/login-new.png)

We just did a transform for the traffic coming into our app during a replay. We can also use transforms for mocks in case we have to parameterize fields like session ids, dates, etc. Check out [this guide](./guides/replay/mocks/edit-sig.md) for a deep dive.

### Assertions

Another assertion that failed in our report is for the `/spacex/ship` endpoint.

![Ship Endpoint](./end-to-end/random.png)

Our app returns a different ship ID every time we make a request so this is an expected failure. We can edit the test config for our Report to account for this.

![Edit Test Config](./end-to-end/report-tc.png)

Click the pencil next to the `HTTP Response Body` assertion and we can add `ship_id` as a json path to ignore.

![Edited](./end-to-end/report-ignore.png)

After saving, we can reanalyze the report and we see much better results!

![Success](./end-to-end/report-success.png)

## Overview

In this demo we:

1. Captured some traffic
2. Analyzed it in the Traffic Viewer
3. Optionally configured DLP
4. Ran a replay and created a snapshot
5. Used auto generated mocks during the replay
6. Transformed some snapshot traffic
7. Edited the assertions
8. Reanalyzed the report for a higher success rate

# Next Steps

This is just a small subset of things you can do with Speedscale, other things to try out could be:

1. Capture traffic from one of your own apps
2. [Replay traffic from one cluster into another](./guides/replay/guide_other_cluster.md)
3. [Run a load test](./guides/replay/load-test.md)
4. [Integrate with CI/CD](./guides/cicd.md)

## Uninstall

If you'd like to remove the demo from your environment follow these instructions:

<Tabs>

<TabItem value="Kubernetes">

```bash
make kube-clean
```

</TabItem>

<TabItem value="Docker">

```bash
docker compose -f speedscale-docker-capture.yaml down
```

</TabItem>

</Tabs>

### (Optional) Data loss Protection

If we drill down into a request, we can also see data we may not want to leave our environment.

![Auth](./end-to-end/unredacted.png)

You can enable DLP to redact certain fields from an RRPair at capture time. Note that this will cause your replays to have low success rates because necessary information will be masked. Check out the [dlp](https://docs.speedscale.com/guides/dlp/) section for more information on DLP configuration. As a starter, you cna follow the instructions below.

<Tabs>

<TabItem value="Kubernetes">

Run:

```bash
speedctl infra dlp enable
```

</TabItem>

<TabItem value="Docker">

Edit `speedscale-docker-capture.yaml` to add the following two environment variables.

```yaml
services:
  forwarder:
    environment:
      - SPEEDSCALE_REDACT=true
      - SPEEDSCALE_DLP_CONFIG=standard
```

</TabItem>

<TabItem value="Local">

Run the `speedctl capture` command with the additional flag `--dlp-config standard`.

</TabItem>

</Tabs>

Now we see the authorization header is redacted and never makes it to Speedscale.

![Redacted](./end-to-end/redacted.png)

For more complex DLP configuration you can use [this guide](./guides/dlp.md).
