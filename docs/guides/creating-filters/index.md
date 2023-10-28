# Creating Traffic Filters

Filters can be saved from the traffic viewer and then used to prevent traffic from ever reaching Speedscale. Most users will create filters using this UI. Filter rules are stored in Speedscale cloud and applied by the Speedscale Forwarder. Once a filter is applied to the forwarder, no traffic will leave your network that is prohibited by the filter.

Here's how you create and apply them:

##  Create Filters From Dashboard

1. Open the Traffic Viewer and select your service
2. Apply filters to narrow down the traffic to only the request/response pairs that you want to allow.

![Filters](./select-filters.png)

3. Click the **Create Filter** button in the top right of the filter section:

![Create Filter](./create-filter.png)

4. Give the filter a unique ID (no spaces) - make sure to remember it.

![Filter Name](./filter_name.png)


## Create Filters With CLI

### Prerequisites
1. [Speedctl is installed](/setup/install/cli.md)

### Pull Filter Using CLI
You can pull your filter using `speedctl`.
```bash
speedctl pull filter my_excellent_filter
```
By default, your filter will be download in `~/.speedscale/data/filters/my_excellent_filter.json`.

After [editing](#edit-filter) the filter, you can use `push` command to update filter in speedscale cloud.
```bash
speedctl push filter my_excellent_filter
```

## Edit Filter
There are two options to edit (or create) a filter:

### 1. Edit Filter Query String
The easiest option is using Query String with CLI. 
You can use following options to edit query string. 

```
header[{key}] {filter_operator} "{value}" # e.g. header[User-Agent] CONTAINS "Prometheus"
reqsoapxpath[{key}] {filter_operator} "{value}"
reqxpath[{key}] {filter_operator} "{value}"
direction {filter_operator} "{value}"  # e.g. direction IS "IN"
location {filter_operator} "{value}"
cluster {filter_operator} "{value}"
service {filter_operator} "{value}"
tag {filter_operator} "{value}"
networkaddr {filter_operator} "{value}"
reqsoapxpath[{key}] {filter_operator} "{value}"
reqxpath[{key}] {filter_operator} "{value}"
namespace {filter_operator} "{value}"
tech {filter_operator} "{value}"
l7protocol {filter_operator} "{value}"
url {filter_operator} "{value}"
command {filter_operator} "{value}"
status {filter_operator} "{value}"
uuid {filter_operator} "{value}"
snapshot {filter_operator} "{value}" 
session {filter_operator} "{value}" 
# time format should be RFC3339
timerange {filter_operator} "{start_time}" "{end_time}" # e.g. timerange IS "2023-10-26T02:28:54Z" "2023-10-29T04:28:54Z"
reqbodyjson {filter_operator} '{value}' # e.g. reqbodyjson IS '{"body": {"key":"value"}, "include_keys": ["key1", "key2"]}'
reqbodyxml {filter_operator} '{value}'
reqbodyhash {filter_operator} '{value}'
```
And this is list of `filter_operator`
```
IS
NOT
CONTAINS
NOTCONTAINS
```
Between each two rules and between each set of rules should be a `logical_operator`: `AND`/`OR`.

Each set of filter rules should be separated with parentheses even if there's only one filter rule.

And if there's more than one rule for a key (`namespace`) they should be grouped together in a single set of parentheses.

This is a full example of a query:
```
(header[User-Agent] CONTAINS "ELB\-HealthChecker/" OR header[User-Agent] CONTAINS "Prometheus/" OR header[User-Agent] CONTAINS "apm-agent-") OR  (timerange IS "2023-10-26T02:28:54Z" "2023-10-26T02:28:54Z")
```

As you can see, all `header` filters are grouped together. And event though for `timerange` we only have a single filter, we still need to wrapp it inside parentheses.

Now you can use
```bash
speedctl push filter my_excellent_filter --query-string '(header[User-Agent] CONTAINS "ELB\-HealthChecker/" OR header[User-Agent] CONTAINS "Prometheus/" OR header[User-Agent] CONTAINS "apm-agent-") OR  (timerange IS "2023-10-26T02:28:54Z" "2023-10-26T02:28:54Z")
```
to update your filter.

Or to use a new filter, you can use `put` command. 
```bash
speedctl put filter --id my_new_excellent_filter --query-string '(header[User-Agent] CONTAINS "ELB\-HealthChecker/" OR header[User-Agent] CONTAINS "Prometheus/" OR header[User-Agent] CONTAINS "apm-agent-") OR  (timerange IS "2023-10-26T02:28:54Z" "2023-10-26T02:28:54Z")
```

## Use your filter

Now, to apply the filter; change the `filterRule` configured in your `values.yaml` file of the operator helm chart to the filter rule name you entered in step 4. After updating or overriding the value, then run the `helm upgrade` command for the changes to take effect. You should see `SPEEDSCALE_FILTER_RULE` is now properly set on the `speedscale-forwarder` config map in your cluster.




Remember, if you get stuck you can get help quickly on the Speedscale [slack](https://slack.speedscale.com)
