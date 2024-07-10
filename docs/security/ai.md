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

## Pro and Free Trials

If you are a non-Enterprise customer and are concerned about AI data usage please contact your Speedscale account representative to explore an Enterprise plan. Speedscale protects all of its customers data but these specific protections are Enterprise-only.