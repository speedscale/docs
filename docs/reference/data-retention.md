---
sidebar_position: 3
---

# Data Retention

Speedscale segments data into three categories which have different data retention policies. Each data tier has a default retention length but can be extended as needed. Please contact your sales representative or reach us on [slack](https://slack.speedscale.com) for more information.

## Traffic Viewer Live Tail

Traffic Viewer is continuously updated from your environment like a monitoring tool. This is the most responsive way to view your data but it also has the highest infrastructure requirements. As a result, this is the most limited type of storage. As data ages out of this tier, it is no longer visible in the main [traffic viewer](https://app.speedscale.com/analyze) but may still be available via API call.

For trial customers, Speedscale makes no guarantees regarding data retention.
For paid users the data retention period is variable but is generally between seven days and three months.

## Long Term Traffic Sorage

After traffic ages out of the Traffic Viewer it is stored in the Speedscale cloud data warehouse in slower long term storage. From this tier you can still create snapshots and view old requests but access is slower. The main difference between data in this tier and the Traffic Viewer tier is that the data is no longer accessible via the UI. This means you access the data using commands like `speedctl create snapshot` or `speedctl get service`.

## Snapshots, Replay Results and Configuration

Snapshots, Replay Results and Configuration are never deleted.
