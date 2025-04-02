---
sidebar_position: 6
---

# Artificial Intelligence (AI)

## Training Policy

Speedscale does not share data between Enterprise customers and does not use Enterprise data for general purpose AI model training. This prevents the Speedscale AI model from learning proprietary data from one tenant and regenerating it for another tenant. Speedscale does not have the same data leakage problems as do pure LLMs.

Models built by customers based on their data are scoped to their secure tenant environment. Speedscale does not export Enterprise customer data for its own uses. For example, if a customer takes Speedscale's default Postgres database model it will be empty and not "pre-trained" on any existing data. Once trained, it is not shared and stays local to the customer's tenant.

## Generative AI

This feature can be turned off by Speedscale and cannot be re-enabled by users or customers without written authorization from the account holder. Generative AI features are provided for test data generation and may involve calls to third party services. If you are running in a highly secure environment please notify Speedscale to disable Generative AI completely.

Enterprise customers also have the option of running a full LLM within their secure Speedscale tenant. This removes the need for third party services. This provides the best of both security and capability but requires special provisioning. Please contact Speedscale support for additional information.

## AI Governance

At Speedscale, we use AI to help software teams work smarter—from surfacing key insights to recommending better ways to test, deploy, or debug code. Here's how we govern our use of AI to ensure it stays secure, ethical, and reliable.

### Responsible AI Principles

Our approach to AI is grounded in five key principles:

#### 1. **Transparency**
We’ll always tell you when and how AI is being used. Where possible, we show context or confidence scores to help you understand model suggestions.

#### 2. **Data Privacy**
On paid plans, we never use your code, traffic, or test data to train shared models. AI features operate on your data securely, in line with our SaaS agreement.

#### 3. **Human in the Loop**
AI features are designed to augment your expertise—not replace it. You always have the final say. You can disable or override AI recommendations at any time.

#### 4. **Security-First**
AI systems are developed and deployed using the same strict security controls we apply across our platform. Access to models and training data is tightly restricted and audited in line with our Privacy Policy.

### Reporting AI Issues

If you ever encounter an issue with an AI-powered feature—such as a faulty recommendation, hallucinated output, or a bias concern—you can report it via our [slack](https://slack.speedscale.com) or by emailing us at [support](mailto:support@speedscale.com). Our AI review team will respond within 1 business day.


## Pro and Free Trials

If you are a non-Enterprise customer and are concerned about AI data usage please contact your Speedscale account representative to explore an Enterprise plan. Speedscale protects all of its customers data but these specific protections are Enterprise-only.