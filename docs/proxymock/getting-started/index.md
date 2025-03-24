import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ForLeaders from './\_value_for_leaders.mdx'
import ForDevelopers from './\_value_for_developers.mdx'

# Getting Started

**proxymock** is a free to use command-line tool that records your application's behavior and generates [mocks](/reference/glossary.md#mock) and [tests](/reference/glossary.md#test). Out-of-the-box functionality is **free forever** for local development. No strings attached.

<Tabs>
  <TabItem value="for developers" label="For Developers">
    <ForDevelopers />
  </TabItem>
  <TabItem value="for leaders" label="For Leaders">
    <ForLeaders />
  </TabItem>
</Tabs>

**proxymock** is a backend service emulator that lets you run your app as if it were in a live environment (like production) even when APIs and databases are unavailable. See [how it works](../reference/index.md) for more.

If you want to deploy any of these [mocks](/reference/glossary.md#mock) or [tests](/reference/glossary.md#test) in the cloud or CI/CD, you can sign up for a **free** account [here](https://app.speedscale.com/signup) for our enterprise service.

---

## [Installation](./installation.md) {#installation}

Learn how to [install](./installation.md) the **proxymock** CLI.

## [Quickstart](./quickstart-cli.md) {#quickstart}

Get started with **proxymock** by following the [quickstart guide](./quickstart-cli.md). You will learn how to create mocks using a demo application built on top of [AWS DynamoDB](https://aws.amazon.com/dynamodb/) and [IP Stack](https://ipstack.com/). IP Stack is very generous with their free tier, but you still need to sign up for an account and are rate limited to 100 requests per day. This guide will show you how to create a realistic mock that sidesteps these limitations.

## [FAQ](./faq.md) {#faq}

Find [answers](./faq.md) to common questions about **proxymock**.

## [Help](./help.md) {#help}

Computers are hard, but we're here to [help](./help.md) with details both free and paid support options.

## [Reference](../reference/index.md) {#reference}

See the [reference](../reference/index.md) for details on more advanced features.

## [Speedscale Enterprise](../../intro.md) {#enterprise}

Once you start capturing traffic **proxymock** can provision these in shared cloud environments. This requires [Speedscale Pro or Enterprise](https://speedscale.com/pricing) which will allow you to deploy your mocks and tests in the cloud or create them using production-grade listeners (think agents). Learn more [here](../../intro.md). This is not science fiction and no aliens were harmed in its creation.
