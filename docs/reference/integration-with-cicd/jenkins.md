---
sidebar_position: 1
---

# Jenkins

One of the most popular CI/CD solutions is Jenkins, an open-source job
execution system.

## Prerequisites

The details of setting up a fully operational Jenkins environment are outside
the scope of this article, so we will assume that you have access to one
already. If you do not, there are pre-built options available, including a
[Docker image](https://hub.docker.com/r/jenkins/jenkins).

Whether your Jenkins jobs run within docker containers or directly on Jenkins
executor nodes, these environments will need to have the following installed:

* [speedctl](../../setup/install/cli-speedctl.md)
* [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
* [jq](https://stedolan.github.io/jq/)

You will also need to create a Speedscale traffic snapshot of your API.

## Integration

### CI/CD Stages

We’ll discuss the Jenkins integrations as a series of discrete stages. There
are many different ways to accomplish this, all of which depend on the specific
needs of your team, application, or build system. For example, a very simple
workflow might look like:

![](https://speedscale.com/wp-content/uploads/2021/08/mermaid-diagram-20210803102316.png)

### Jenkinsfile

A `Jenkinsfile` is [groovy](http://groovy-lang.org) script, checked into source
control at the root of your project that defines the stages of a [Jenkins
Pipeline](https://www.jenkins.io/doc/book/pipeline/getting-started/). Based on
our workflow shown above, let’s define a simple pipeline:

```
#!groovy

pipeline {
  agent any

  stages {
    stage('validate') {
      steps {
        sh 'kubectl apply -f qa-deployment.yaml -n qa'
        sh 'sh speedscale.sh'
      }
    }
    stage('deploy') {
      steps {
        sh 'kubectl apply -f deployment.yaml -n prod'
      }
    }
  }
  post{
    success{
      echo "======== pipeline executed successfully ========"
    }
    failure{
      echo "======== pipeline execution failed ========"
    }
  }
}
```

In this simple pipeline, there are two discrete steps:

1. `validate`: a test Kubernetes deployment is made to a `qa` namespace, followed by a `speedscale.sh` script that will start the scenario and wait for the results.
2. `deploy`: your application is deployed into a `prod` namespace if the previous step succeeds

Note that we’re assuming that your repository is already configured for Jenkins
integration, so we won’t discuss how to configure a new Jenkins job. If you
don’t, work with your Jenkins administrator to define a new job that uses SCM
to watch your repository for changes and execute the `Jenkinsfile` in your
project.

### Running Speedscale

In the `validate` stage above, you’ll notice that there is an initial `kubectl
apply` step to apply a specific yaml file from your repository into a `qa`
namespace. This step could be anything, but the intent here is to deploy your
application into a non-production environment; the `qa-deployment.yaml` could
contain the Kubernetes resource definitions necessary to facilitate this.

The second step is the bulk of this stage. In this step, we’ll execute a
`speedscale.sh` script that performs the remaining work necessary to initiate
our Speedscale test and check the results. This script can either live in your
repository or exist as a utility available in your Jenkins environment. For
example, this script might look something like:

```
#!/bin/bash

# ensure that you have speedctl available on your path
export PATH=$PATH:/var/lib/jenkins/.speedscale

# create a unique report tag that identifies this run
REPORT_TAG=$(git rev-list --abbrev-commit --max-count=1 HEAD)-$(date +%s)

# modify a patch template file and apply it to your kubernetes test deployment
sed "s/REPORT_TAG/${REPORT_TAG}/g" scenario.yaml.tpl > scenario.yaml
kubectl patch deployment my-deployment --patch "$(cat scenario.yaml)" -n qa

echo "Waiting for scenario report to be available"

for i in {1..20}; do
  echo "Checking for available report (attempt ${i})"

  # make sure the report exists
  report_id=$(speedctl get reports --tag "${REPORT_TAG}" | jq -r .Id || true)
  if [[ "$report_id" == "" ]]; then
    echo "Report not found, sleeping"
    sleep 30
    continue
  fi
  
  # get and check the status for the report ID we found
  status=$(speedctl get report ${report_id} | jq -rc 'report.status' | tr '[[:upper:]]' '[[:lower:]]' || true)
  case ${status} in
    "" | "initializing" | "in progress" | "running")
      echo "Report not ready, sleeping (status ${status})"
      sleep 30
      ;;

    "complete" | "missed goals" | "stopped" | "passed")
      echo "Report complete (status ${status})"
      events=$(speedctl get report ${REPORT_TAG} | jq -rc 'report.events' )
      if [[ "${events}" == "" ]]; then
        echo "Passed!"
        exit 0
      else
        echo "Failed!"
        exit 1
      fi
      ;;
  esac
done
```

In this script, we are first generating a unique tag that can be used to
identify the report for this Speedscale run. We then need to patch the test
deployment we created in the previous step in our Jenkins pipeline stage to
start the test. Because `kubectl` does not support templated yaml files, we are
performing an intermediate step with a file called `scenario.yaml.tpl` in which
we replate a template variable with the unique tag we generated. Patching your
test deployment with the resulting file will initiate the test, so let’s take a
look at what this template file might look like:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
  annotations:
    replay.speedscale.com/snapshot-id: 954957b1-8aa5-453d-bace-a766f1992a2f
    replay.speedscale.com/testconfig-id: standard
    replay.speedscale.com/cleanup: "true"
    replay.speedscale.com/build-tag: REPORT_TAG
    sidecar.speedscale.com/inject: "true"
```

Once patched, `speedctl` can be used to check the status of the run:

```
status=$(speedctl get report ${SCENARIO_TAG} | jq -rc 'report.status' | tr '[[:upper:]]' '[[:lower:]]' || true)
```

The status returned from this command will be one of `complete`, `missed
goals`, `stopped`, `passed`, or may be an empty string (which means the test is
starting). When the test is complete and the report is available, checking the
`events` field will give us an indication of the test outcome, no events
meaning that the test succeeded.

### Deploy!

As mentioned before, the previous stage is the bulk of this simple example. If
this stage fails to complete successfully, Jenkins will fail the pipeline at
that stage. Using Speedscale as a pipeline gating mechanism means you can do
lots of things such as promoting your application to a staging environment,
executing additional downstream jobs, sending notifications, etc. In our simple
case we have chosen to perform a production deployment.
