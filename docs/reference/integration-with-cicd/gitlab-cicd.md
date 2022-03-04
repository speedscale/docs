---
sidebar_position: 2
---

# GitLab CICD

How to integrate Speedscale with GitLab CICD.

Example deployment with a GitLab hash:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  annotations:
    test.speedscale.com/scenarioid: 6aad9ac9-f7af-43f0-9528-0145bb9518a0
    test.speedscale.com/testconfigid: standard
    test.speedscale.com/tag: 31187a5a
```

In the above example, **31187a5a** can be used to search for this report via **speedctl**. Note that there can a delay from the time when you start your deployment and when the report can be queried, so you want to loop on this call until the report returns.

```
speedctl report list | grep 31187a5a
```

Once you know the report is initialized, then you want to get the status:

```
speedctl report list | grep 31187a5a | jq -r .status
```

The value of status will be what you see in the Speedscale UI:

* RUNNING
* PASSED
* MISSED_GOALS
* STOPPED
* INITIALIZING
* PROCESSING
* RPT_STATUS_ERROR

Vanilla kubernetes deployment yaml files don't allow templated or dynamic variables, as is the case with commit hashes. Helm is a potential solution to this. Alternatively, a simple way to do this would be via an intermediate template file. For example, assume you have a file named **scenario.tpl.yaml**:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  annotations:
    test.speedscale.com/scenarioid: 6aad9ac9-f7af-43f0-9528-0145bb9518a0
    test.speedscale.com/testconfigid: my_test_config
    test.speedscale.com/tag: COMMIT_HASH
```

You can prepare a **scenario.yaml** file along the lines of:

```
SCENARIO_TAG=$(git rev-list --abbrev-commit --max-count=1 HEAD)-$(date +%s%N)
sed "s/COMMIT_HASH/${SCENARIO_TAG}/g" scenario.tpl.yaml | kubectl apply -f -
```

After applying the tagged snapshot, the CI/CD system must wait until the report has completed. Initially it will not be ready until the system under test has been fully provisioned and traffic has begun to be generated, so setup a loop to wait for the report to appear:

```
ATTEMPT_COUNTER=0
MAX_ATTEMPTS=5
until [ ! -z "$(speedctl report list |grep ${REVISION} ||true)" ]; do
    if [[ ${ATTEMPT_COUNTER} == ${MAX_ATTEMPTS} ]]; then
      echo "Max attempts reached"
      exit 1
    fi
    echo '. waiting for report'
    ATTEMPT_COUNTER=$(($ATTEMPT_COUNTER+1))
    sleep 30
done
```

Now that the report is available, check the status:

```
ATTEMPT_COUNTER=0
MAX_ATTEMPTS=5
FINISHED_STATUSES='PASSED MISSED_GOALS'
STATUS=$(jq -r .status <<<$(speedctl report list |grep ${REVISION}))
until [[ "$FINISHED_STATUSES" =~ "$STATUS" ]]; do
    if [[ ${ATTEMPT_COUNTER} == ${MAX_ATTEMPTS} ]]; then
      echo "Max attempts reached"
      exit 1
    fi
    echo '. waiting for report analysis'
    ATTEMPT_COUNTER=$(($ATTEMPT_COUNTER+1))
    sleep 5

    STATUS=$(jq -r .status <<<$(speedctl report list |grep ${REVISION}))
done
```

Once the snapshot has completed its run, CI/CD systems must interpret the outcome. There are many ways to do this, but generally speaking, most build systems will expect a non-zero exit code in the event of a failure in the pipeline. Adding on to our previous example, we can add another case, but also check to see if any "interesting events" (e.g. our alert conditions) have been triggered:

```
echo ${STATUS}
if [[ ${STATUS} != 'PASSED' ]]; then
  exit 1
fi
```

And that's it!
