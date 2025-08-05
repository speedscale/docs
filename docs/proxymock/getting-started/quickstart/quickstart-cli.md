---
sidebar_position: 3
---
import ArchitectureOverview from './outerspace-go.png'
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from '../../index/_cli_macos_minified.mdx'
import LinuxCLIInstall from '../../index/_cli_linux_minified.mdx'
import { EditingTestsCard, CICDIntegrationCard, RemoteRecordersCard } from '@site/src/components/Cards';

# Quickstart (CLI)

This guide provides a step-by-step approach to creating a [mock server](reference/glossary.md#mock-server) and tests for a simple Go application using only the **proxymock** CLI.

## Before you begin

Make sure you have:

- A terminal or command prompt open to run proxymock
- A separate terminal or command prompt open to run the demo app
- [go version 1.23.1](https://go.dev/doc/install) or newer installed

<img src={ArchitectureOverview} alt="Architecture Overview" width="500" style={{ display: 'block', margin: '0 auto' }} />

For this example we'll be using a simple demo app that accepts an API request, calls two downstream APIs and returns the results.

:::note
Use Github Codespaces if you'd rather use a packaged environment and not install locally. Simply navigate to the demo [repository](https://github.com/speedscale/outerspace-go) and create a new Codespace:

![Codespaces](./codespaces.png)
:::

## Step 1: Install proxymock {#install}

<Tabs>
  <TabItem value="mac" label="macOS">
    <MacCLIInstall />
  </TabItem>
  <TabItem value="linux" label="Linux">
    <LinuxCLIInstall />
  </TabItem>
  <TabItem value="binary" label="Other (Detailed)">
    For other operating systems and more detailed instructions, see the [installation](../installation.md) instructions.
  </TabItem>
</Tabs>

Need another OS like Windows or are you having issues? See advanced [installation](../installation.md).

## Step 2: Initialize proxymock {#initializing}

Run the following command to obtain an API key:

```shell
proxymock init
```

Don't worry, we don't sell marketing data or give your email address to any bot nets.

## Step 3: Install the demo app and start recording {#recording}

```shell
git clone https://github.com/speedscale/outerspace-go && cd outerspace-go && proxymock record -- go run main.go
```

proxymock is now listening on port 4343 for incoming traffic. This traffic will be forwarded to the demo app running at 8080.

```shell jsx title="Output"
$ git clone https://github.com/speedscale/outerspace-go && cd outerspace-go && proxymock record -- go run main.go
Cloning into 'outerspace-go'...
remote: Enumerating objects: 780, done.
remote: Counting objects: 100% (780/780), done.
remote: Compressing objects: 100% (360/360), done.
remote: Total 780 (delta 338), reused 715 (delta 287), pack-reused 0 (from 0)
Receiving objects: 100% (780/780), 736.18 KiB | 229.00 KiB/s, done.
Resolving deltas: 100% (338/338), done.
proxymock output will be redirected to proxymock/recorded-2025-07-30_15-19-11.417616Z/proxymock.log
Press ctrl-c to interrupt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2025/07/30 15:19:12 Starting HTTP server on :8080
2025/07/30 15:19:13 Starting gRPC server on :50053
```

## Step 4: Run test transactions {#run-tests}

Start a *new* terminal and run the following command.

```shell jsx title="Run in new terminal window"
cd outerspace-go && ./tests/run_http_tests.sh --recording
```

You will now see a set of output from the tests:

```shell jsx title="Test output"
$ cd outerspace-go && ./tests/run_http_tests.sh -recording
Using default port 8080
Testing http://localhost:8080/... OK (200)
Testing http://localhost:8080/api/numbers... OK (200)
Testing http://localhost:8080/api/latest-launch... OK (200)
Testing http://localhost:8080/api/rockets... OK (200)
Testing http://localhost:8080/api/rocket?id=5e9d0d96eda699382d09d1ee... OK (200)
Http tests passed.
```

You can now press CTRL-C in the `proxymock record` terminal window to shut down recording.

You will also see some additional output in the original proxymock terminal window showing requests were handled by the demo app:

```shell jsx title="proxymock recording output"
2025-07-30T15:31:57-04:00 INF Inbound latency=0.080292 method=GET path=/ query=
2025-07-30T15:31:57-04:00 INF X-Header found header=X-Numbers-Api-Type values=["math"]
2025-07-30T15:31:57-04:00 INF X-Header found header=X-Powered-By values=["Express"]
2025-07-30T15:31:57-04:00 INF X-Header found header=X-Numbers-Api-Number values=["1804"]
2025-07-30T15:31:57-04:00 INF Outbound host=numbersapi.com latency=64.452875 method=GET status=200
...
```

## Step 5: View recording results {#view-recording}

There should be a new directory in the `proxymock` subdirectory inside `outerspace-go`.

```shell
ls proxymock
...
recorded-2025-07-30_15-31-43.701537Z
```

The traffic you just recorded is contained in the most recent directory. In this case that's `recorded-2025-07-30_15-31-43.701537Z` but it will change based on the date of recording. Each API request can be inspected as a markdown file:

```shell
$ cat proxymock/recorded-2025-07-30_15-31-43.701537Z/localhost/2025-07-30_19-56-08.410226Z.md

### REQUEST (TEST) ###
``
GET http://localhost:4143/ HTTP/1.1
Accept: */*
Host: localhost:4143
User-Agent: curl/8.7.1
...
```

## Step 6: Run mock server and tests {#run-mocks}

Go back to your original terminal (running `proxymock record`), stop proxymock by running CTRL-C and then start a mock server:

```shell
proxymock mock -- go run main.go
```

Your demo app will now start using the local mock server.

:::note
When running `proxymock mock` your app no longer requires access to backend systems. The app will talk locally to proxymock instead of outside APIs.
:::

Now exercise your demo app by running the same tests we ran before - except using the recording instead of a script. proxymock takes the recorded inbound requests and re-uses them as tests.

Open your second terminal window and run the following:

```shell
proxymock replay --test-against http://localhost:8080
```

proxymock will now run the original recorded. The demo app no longer requires downstream systems for these tests as they are being simulated by proxymock.

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
  <EditingTestsCard />
  <CICDIntegrationCard />
  <RemoteRecordersCard />
</div>
