---
title: Creating Traffic Filters
sidebar_position: 3
---
# Creating Traffic Filters

Filters can be saved from the traffic viewer and then used to prevent traffic from ever reaching Speedscale. Most users will create filters using this UI. Filter rules are stored in Speedscale cloud and applied by the Speedscale Forwarder. Once a filter is applied to the forwarder, no traffic will leave your network that is prohibited by the filter.

Here's how you apply them:

1. Open the Traffic Viewer and select your service
2. Apply filters to narrow down the traffic to only the request/response pairs that you want to allow.

![Filters](./select-filters.png)

3. Click the **Create Filter** button in the top right of the filter section:

![Create Filter](./create-filter.png)

4. Give the filter a unique ID (no spaces) - make sure to remember it.

![Filter Name](./filter_name.png)

5. Change the `SPEEDSCALE_FILTER_RULE` environment variable for your forwarder to the filter rule name you entered in step 4. If you are using Kubernetes that means changing the `SPEEDSCALE_FILTER_RULE` value in the `speedscale-forwarder` configmap. You can usually do this by running the following command and adding/editing the value `kubectl -n speedscale edit configmap speedscale-forwarder`

Remember, if you get stuck you can get help quickly on the Speedscale [slack](https://slack.speedscale.com)
