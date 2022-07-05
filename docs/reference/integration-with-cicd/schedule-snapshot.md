# Creating and replaying a snapshot on a schedule

It's common to want to test services on a scheduled basis.
You may want tests that gate hourly or daily deploys, or you may want to test the latest development branch before rolling features out.

Speedscale can help with this using our `speedctl` command line utility and a Kubernetes `CronJob`.

First, lets take a look at a script that will create a snapshot of for a service given the service's name, the namespace its within, and the Kubernets cluster.
To keep things simple, we'll always snapshot the last hour of traffic.
We'll go through the script piece by piece, then present the whole thing at the end.

## Key concepts

While this script is almost 200 lines long, it really relies on a few key commands.

* `speedctl put snapshot` - creates a snapshot based on a JSON file containing traffic selection criteria
* `speedctl get snapshot` - retrieves a JSON object describing a Snapshot's current state
* `speedctl infra replay` - instructs Speedscale to run a replay within the specified Kubernetes cluster
* `speedctl get report` - retrieves a JSON object containing results of a replay

## Required information

We'll need a few pieces of information to create the snapshot.
These are:

* The service name for which we're snapshotting traffic
* The namespace that contains the service 
* Our cluster's name within the Speedscale cloud

We'll also need some other information, but we can calculate these.

* Start and end times, which we'll set to be the last 1 hour
* A snapshot name, generated from the above information.

## Gathering the information

### Identifying the service

First, we'll take our required fields from the command line.
Calling the script will be in this form:

```shell
./snapshot_and_replay.sh <service> <namespace> <cluster>
```

Within the script, that will look like

```shell
SERVICE_NAME=$1
NAMESPACE=$2
CLUSTER_NAME=$3
```

### Creating the time boundaries

Next, we'll want to calculate the start and end times.
Having a deadline for timeouts would also be nice, just in case the snapshot is large and has a lot of traffic.
To do this, we'll use the `date` utility with UTC time for start and end times, and using seconds since the epoch for our deadline, to make the math easy.


You'll notice that we've got two variants - one for macOS or Darwin, and one for Linux.
This is because their `date` arguments are slightly different, but we'd still like the script to work on both for local testing and within a container or continuous integration service.

```shell
OS=$(uname -s)

# We want the last hour of traffic, so get the current date/time and subtract 60 minutes
# We also want a timeout, so set a deadline
case ${OS} in
    Darwin*)
        starttime=$(date -j -u -v-1H +"%Y-%m-%dT%TZ")
        endtime=$(date -j -u +"%Y-%m-%dT%TZ")
        deadline=$(date -j -v+5M +"%s")
        ;;
    Linux*)
        starttime=$(date --utc --date="-1 hour" +"%Y-%m-%dT%TZ")
        endtime=$(date --utc +"%Y-%m-%dT%TZ")
        deadline=$(date --date="+5 minutes" +"%s")
esac
```

Here, we are getting the start time and end time in the format `Year-month-dateTTimeZ`, which may look like this for July 5, 2022: `2022-07-05T17:14:55Z`.
This is the format that Speedscale expects for creating snapshots.

The `deadline` variable is only used within our script, and we want to easily compare timestamps.
Rather than parsing our formatted strings, we can simply ask `date` what the seconds since the epoch will be in five minutes, and check current time against this value later one.

### Creating the snapshot

Now we'll take the information we've gathered or calculated and create the snapshot within Speedscale.

First, we'll generate a name for the snapshot based on cluster name, service name, and start time.

```shell
SNAP_NAME="Cluster: ${CLUSTER_NAME} Service: ${SERVICE_NAME} starting at ${starttime}"
```

Next, we need to provide a JSON file to `speedctl put snapshot` containing the parameters we want.
We'll put this in temporary storage, since this command does not accept piped input.

```shell
snapfile=$(mktemp /tmp/snapshot-in.XXXX)
```

Next, we'll substiture our variables into the JSON values, and output the result into the temporary `snapfile`.

```shell
cat << EOF > ${snapfile}
{
  "meta": {
    "name": "${SNAP_NAME}",
    "startTime": "${starttime}",
    "endTime": "${endtime}",
    "serviceName": "${SERVICE_NAME}"
  },
  "tokenConfigId": "standard",
  "tokenizerConfig": {
    "name": "standard",
    "id": "standard"
  },
  "filter_expression": {
    "conditions": [
      {
        "filters": [
          {
            "include": true,
            "service": "${SERVICE_NAME}"
          }
        ]
      },
      {
        "filters": [
          {
            "include": true,
            "cluster": "${CLUSTER_NAME}"
          }
        ]
      },
      {
        "filters": [
          {
            "include": true,
            "timeRange": {
              "startTime": "${starttime}",
              "endTime": "${endtime}"
            }
          }
        ]
      }
    ]
  }
}
EOF
```

Before moving on, lets examine the elements of this JSON structure more closely.

First, the metadata.

```shell
  "meta": {
    "name": "${SNAP_NAME}",
    "startTime": "${starttime}",
    "endTime": "${endtime}",
    "serviceName": "${SERVICE_NAME}"
  },
```

This structure provides the high level information we need; the name of the snapshot, when it started and ended, and the service name we're interested in.

Next, we see some information about how we'll parse tokens within the snapshot.
We're not looking to do much with the information in this snapshot, so we'll use the standard Token Config and Tokenizer Config.

```shell
  "tokenConfigId": "standard",
  "tokenizerConfig": {
    "name": "standard",
    "id": "standard"
  },
```

Finally, we provide [Filter Expressions](../../../configuration/filters).
These expressions allow you to more selectively include traffic for a service, based on a number of criteria.
For this test case, we want to _include_ traffic that matches the service name, the cluster name, and our time range.
By default, filter expressions will exclude traffic.
Therefore, for each filter, we specify the `include` directive.


```shell
  "filter_expression": {
    "conditions": [
      {
        "filters": [
          {
            "include": true,
            "service": "${SERVICE_NAME}"
          }
        ]
      },
      {
        "filters": [
          {
            "include": true,
            "cluster": "${CLUSTER_NAME}"
          }
        ]
      },
      {
        "filters": [
          {
            "include": true,
            "timeRange": {
              "startTime": "${starttime}",
              "endTime": "${endtime}"
            }
          }
        ]
      }
    ]
  }
```

All that is left to do now is to create the snapshot with `speedctl`.

```shell
snapid=$(speedctl put snapshot ${snapfile})
```

This command uploads our snapshot file to the Speedscale cloud for processing, and saves the generated ID into the `snapid` variable.

### Checking status of the snapshot

Before we can replay traffic from the snapshot, we'll need to wait for the snapshot we created to be ready.
We'll do this with a loop.



```shell
last=""
while [ $(date +"%s") -lt ${deadline} ]; do
```

Before the loop, we create an empty variable to hold the last observed status.
This helps reduce the amount of messages we'll receive.

Our loop will continue while the current time is less than the deadline.

```shell
    snapJSON=$(speedctl get snapshot ${snapid})
    status=$(echo ${snapJSON} | jq -r ".status")
   
    # Don't show a new line unless there's a change
    if [[ $last == $status ]]; then
        continue
    fi

    last=${status}
```

Within the loop, we'll use `speedctl get snapshot` to download the JSON of the snapshot we created.
Then, `jq` will extract the `status` field for comparison.
By the way, the `jq -r` flag returns raw output without quotes.

Before moving on to check the actualy value of our status, we check to see if the current status matches the last one, updating the last observed status once it has changed.

```shell
    case $status in
        Error)
            echo "Error: $(echo ${snapJSON} | jq -r '.processingDetails')"
            exit
            ;;
        Complete)
            echo "Done!"
            break
            ;;
        *)
            echo ${status}
            ;;
    esac
done

if [ $(date +"%s") -gt ${deadline} ]; then
    echo "Timed out waiting on snapshot status."
    exit
fi
```

Here, we look at the report's status, taking action depending on what state it is in.
If the snapshot is errored, we will print the details provided, and exit the script.
When the snapshot is complete, we'll output that fact and break out of this loop.
For any other status, such as `In Processing`, the loop will continue.

After we've exited the loop, see if the process has timed out, and exit if so.

### Replaying the snapshot

Now that we've got a completed snapshot of traffic, we'll need to replay it.

We'll start off by creating a replay using the snapshot ID we saved earlier.

```shell
reportid=$(speedctl infra replay ${SERVICE_NAME} --cluster ${CLUSTER_NAME} --namespace ${NAMESPACE} --snapshot-id ${snapid})
```

`reportid` saves the ID so we can query its status.

The loop here looks slightly different - in addition to querying the Speedscale cloud, we'll also look for the TrafficReplay created within our Kubernetes cluster.

```shell
last=""
replayFound=false
```

As before, we'll use `last` to hold the last observed status.
Additionally, we'll use `replayFound` to indicate when the replay has been created within our cluster.

```shell
while [ $(date +"%s") -lt ${deadline} ]; do
    reportJSON=$(speedctl get report ${reportid})
    status=$(echo ${reportJSON} | jq -r ".report.status")
    scenarioStatus=$(echo ${reportJSON} | jq -r ".report.scenario.status")
```

Once again, we'll use the deadline as our looping condition and retrieve the JSON of the report.
For reports, there is an attached Scenario that has its own status that need to be checked, so we'll save that, too.

```shell
    case $scenarioStatus in
        Error)
            echo "Error: $(echo ${reportJSON} | jq -r '.report.scenario.processingDetails')"
            exit
            ;;
        *)
            ;;
    esac

    # Don't show a new line unless there's a change
    if [[ $last == $status ]]; then
        continue
    fi
    last=${status}
```

If the report's scenario had an error, we'll exit the script and print the details.
Otherwise, we'll continue on, checking the status output against the last value

```shell
    replayName=$(echo ${reportJSON} | jq -r ".report.tags.replayName")

    if [[ ! -z "${replayName}" && ! ${replayFound} ]]; then
        replayFound=true
        echo "Replay running in cluster as ${replayName}"
        echo "View status with:"
        echo "  kubectl get -n ${NAMESPACE} trafficreplay/${replayName}"
    fi
```

If we've found a replay, we'll print the name, along with a command to view the TrafficReplay within the Kubernetes cluster.
The `replayFound` variable lets us only output this once.


Lastly, we'll act on the status of the report.

```shell
    case $status in
        Error)
            echo "Error: $(echo ${reportJSON} | jq -r '.report.processingDetails')"
            exit
            ;;
        Passed)
            echo "Done!"
            break
            ;;
        *)
            echo "Report status: ${status}"
            ;;
    esac
done

if [ $(date +"%s") -gt ${deadline} ]; then
    echo "Timed out waiting on report status."
    exit
fi
```

As with the snapshot, we check for errors and print out any details.
If the report has successfully passed, we can break the loop.
And if we have any other intermediate state, we'll continue to wait.

To wrap up the script, we again check for the time out, since we could have reached this point via the loop condition.

## Next steps

Next, we'll look at how to add a Kubernetes [CronJob](https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/) that will run this script on a schedule.

## The full script

The entire script is [available on GitLab](https://gitlab.com/-/snippets/2363552).
TODO: figure out how to embed, preferably without copy/pasting the whole thing in.
