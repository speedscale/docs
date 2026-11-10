---
title: Integration testing with Kiro
description: "Install proxymock in Kiro, review a testing spec, and verify recorded behavior with dependency mocks, evaluated assertions and native schema coverage."
sidebar_position: 4
---

import styles from '@site/src/css/kiro-prompts.module.css';

# Integration testing with Kiro and proxymock

Have Kiro write a testing spec, then implement it using recorded requests and dependency responses. The proxymock tools run the tests and supply native comparison, assertion and schema-coverage results for you to review.

## Choose an application

Open your application repository in [Kiro IDE](https://kiro.dev/ide/). You need its runtime, a build/start command, an OpenAPI contract and recorded inbound traffic with the outbound calls needed to mock its dependencies.

For an example, use one of these public repositories:

- [Spring Bedrock demo](https://github.com/speedscale/spring-bedrock-demo): a Java 21 Spring Boot API calling Amazon Bedrock, with a [finished test report](https://github.com/speedscale/spring-bedrock-demo/blob/main/docs/testing/report.md), [reviewed spec](https://github.com/speedscale/spring-bedrock-demo/blob/main/.kiro/specs/recorded-traffic-integration-tests/spec.md), OpenAPI contract and redacted recording. Its README explains offline replay and optional Kubernetes capture.
- [mock-lab](https://github.com/speedscale/mock-lab): small applications in several languages with recorded examples. Open the individual language application's directory in Kiro and follow its README.

Use a checked-in, reviewed recording or connect to your own Speedscale Cloud capture or BYOC bucket. Creating fresh Bedrock traffic requires AWS access and makes paid model calls; replaying with recorded dependency mocks should not call Bedrock. For cluster capture, use the example's API client Job against the Kubernetes Service.

## 1. Install proxymock in Kiro

Paste this into Kiro:

<div className={styles.prompt}>

```text
Install proxymock using https://docs.speedscale.com/proxymock/getting-started/installation/. Connect its MCP server and Speedscale skills to Kiro in my user settings. Verify the connection and skills, then stop. Keep credentials out of this repository.
```

</div>

Complete the browser sign-in if this is your first proxymock setup. Reload Kiro when needed to load the new MCP server. Confirm that the proxymock tools and Speedscale skills are available before continuing. To configure only Kiro manually, use `proxymock mcp install --client kiro --scope user --skills`; `--dry-run` previews its paths. They belong in Kiro's user configuration; the application repository holds the tests and reusable proxymock assets.

If you use an organization-managed Kiro subscription, sign in with that organization's profile. Review command permissions during setup using [Kiro's permission controls](https://kiro.dev/docs/permissions/).

## 2. Create the testing spec

Start a fresh chat in the application directory. Paste:

<div className={styles.prompt}>

```text
Write a short integration-testing spec for this app. Use existing recorded traffic or discover it in Speedscale Cloud or the connected bucket. Mock dependencies, evaluate assertions, measure native OpenAPI coverage and run twice unchanged. Use recorded cases only; report gaps without filling them. Include capture-time DLP and versioned redacted fixtures. Keep the app unchanged. Stop for review.
```

</div>

Let Kiro inspect the application and propose the spec before implementation. If several captured workloads match, identify your intended service or cluster. You do not need to start by supplying bucket names or snapshot IDs.

## 3. Review and refine the spec

Read the requirements, design and tasks. The approved spec should state:

- **Inputs:** select one real recording and freeze it for both runs. Keep the recorded validation cases; create no additional cases or dependency responses.
- **Mocks:** use recorded dependency responses with passthrough disabled. For Java, wrap the actual Java command (`proxymock mock ... -- /path/to/java -jar app.jar`) so proxy and TLS settings reach the JVM. Use dummy AWS credentials for local tests. An unused STS recording is expected when local credentials replace IRSA.
- **Checks:** evaluate native assertions and compare response status and body for every selected inbound request. Require zero mismatches, zero failed assertions and zero mock MISS or PASSTHROUGH. Derive counts from the recording.
- **Coverage:** run native `proxymock coverage` against the real OpenAPI file for both recorded and replayed traffic. Show covered/total operations, statuses and fields, plus the uncovered paths. Report gaps without adding cases or changing the contract.
- **Artifacts:** keep reusable proxymock configuration, the DLP policy and reviewed redacted recordings in Git. Apply DLP before capture export, verify a fresh recording, and review it for private infrastructure details before committing. Ignore disposable outputs rather than all of `proxymock/`.
- **Execution:** generate one small runner, run it twice with unchanged inputs, save native evidence and write a short report. Stop after reporting. Exclude new frameworks, fault injection, extra failure experiments and unrelated CI or application changes.

Use this review to keep the required work small. Missing prerequisites should stop execution with a clear explanation, rather than trigger a new setup project. See [Kiro specs](https://kiro.dev/docs/specs/) for its review and implementation workflow and [capture-side DLP](https://docs.speedscale.com/guides/dlp/applying-rules/) for redaction setup. Existing snapshots do not become sanitized when you enable DLP later.

## 4. Implement the approved spec

Save the reviewed spec files in the project. In the same chat, paste:

<div className={styles.prompt}>

```text
Read the reviewed spec from disk. Implement it, run the tests twice, and report the results.
```

</div>

You can also use **Run all tasks** in the reviewed spec's task list to start implementation. The approved requirements still govern the selected recording, both unchanged runs and the report.

Kiro should generate the runner from the approved requirements, use the chosen recording for tests and mocks, and save separate results for both runs. It should compare outcomes and coverage between runs without changing the inputs or retrying failures until they pass.

## 5. Read the report

Check both run verdicts and open the linked native evidence. The report should show response matches, assertions evaluated/passed/failed, dependency HIT/MISS/PASSTHROUGH counts and recorded versus replayed schema coverage. A successful process exit alone is insufficient.

Review the uncovered operations, statuses and fields. A documented 503 response can remain uncovered when no such response was recorded. Schema coverage measures observed contract behavior; it is separate from assertion success and code coverage.

Commit the reviewed spec, generated runner, reusable test configuration and verified redacted fixture so another developer can repeat the test. Use the example repository's instructions to run an existing finished suite; use a fresh chat and the prompts above when generating your own.

## If progress stops

| Symptom | Check |
| --- | --- |
| The proxymock tools are missing | Finish installation, reload Kiro and verify its MCP connection and user skills. |
| Kiro appears idle | Look for a pending approval before treating it as a slow command. |
| Java HTTPS mocking fails | Check the required JDK and the proxymock JVM wrapper; shell proxy variables alone may not configure Java. |
| No suitable recording exists | Capture the intended app and its dependencies. Stop before inventing replacement traffic. |
| Results or coverage are missing | Treat the run as incomplete and inspect native outputs before accepting a PASS. |
