---
title: AWS
---

# AWS Services

Speedscale can be used with most AWS services simply by running your app and recording traffic. As a convenience, we also provide some pre-made mocks for easy of use purposes. Making a new mock is very easy and you can learn more about it in the [create your own mocks](../getting-started/quickstart-cli.md#record-with-live-systems) section.

A list of known supported technologies can be found [here](../../reference/technology-support.md). However, your API or Database may just work so you should try it out.

## General API Information

AWS Services use a variety of different API formats and protocols. Speedscale will automatically detect the API format and use the correct one. Here are some general purpose insights for the AWS APIs that utilize HTTP.

### Headers

* X-Amz-Target: If present, this header contains the API version and the command. For example, `DynamoDB_20120810.GetItem` tells the API the service is DynamoDB and the command is GetItem.
* Authorization: This header typically contains a proprietary token that is used to authenticate the request. Usually this comes in a format starting with `AWS4-HMAC-SHA256` or something similar.
* X-Amz-Date: This header contains the date and time of the request in ISO 8601 format.
* X-Amz-Security-Token: This header contains a temporary security token that is used to authenticate the request.

Generally speaking, changing the values of these headers is not necessary to use the mock. The hostname of the service is typically enough to deduce most of the necessary target information.

### Body

The body of the request and response is typically a JSON object. The structure of the body is specific to the API and command.
