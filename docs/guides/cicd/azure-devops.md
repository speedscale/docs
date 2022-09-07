---
sidebar_position: 3
---

# Azure DevOps

[What is Azure DevOps?](https://docs.microsoft.com/en-us/azure/devops/user-guide/what-is-azure-devops?view=azure-devops)

## Prerequisites

In order to integrate Speedscale into your CICD, there are few steps that needs to be taken before the implementation

- Kubernetes (k8s) cluster with Speedscale installed (see Install section in Docs)
- Installed [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/) for debug
- [Service connection to your k8s cluster](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops&tabs=yaml)
- Speedscale Snapshot ID (aka Scenario ID, e.g. 9923413-e1a-44xx-az2a-70138)
- Speedscale Test config ID (e.g. standard, performance_10replicas)
- Speedscale API Key (can be found under profile) - **will be treated as a secret**
- Your Speedscale `config.yaml` file, which can be obtained from your local one `~/.speedscale/config.yaml`

## Integration

You can use Speedscale in several places - in merge request, after deploy or ad-hoc. This guide provides
general pipeline template to accomplish Speedscale tests execution but timing is solely upon your needs. 

## Guide
### 1. Speedscale config.yaml preparation
In order to work with speedscale cli (speedctl), you need a config.yaml with your organisation specific values.
You can get this file from you local, after you install speedctl and run `speedctl init`.

This file has to be placed next to your pipeline template otherwise path to the file needs to be adjusted.
If you pipeline fails during `speedscale - Install cli` step with error `ERROR: ~/.speedscale/config.yaml not exists`
you need to adjust file copy in `speedscale - Install cli` step, so it will use the correct file path.
```bash
cp config.yaml ~/.speedscale/config.yaml
```

It is important to replace apiKey with **apiKeyPlaceholder**, in order to prevent secrets exposure. 
The placeholder will be replaced within the pipeline template.

Example of `config.yaml`
```yaml
current-context: my-context
contexts:
  - name: my-context
    kind: enterprise
    loglevel: info
    container-type: stable
    container-registry: gcr.io/speedscale
    tenant: "000062"
    app-url: app.speedscale.com
  - name: local
    kind: local
    loglevel: info
    container-type: stable
    container-registry: public.ecr.aws/speedscale
tenants:
  - id: 01fde7a0-b929-xxx
    name: "000062"
    bucket: sstenant-00xxx
    region: us-east-1
    apikey: apiKeyPlaceholder
    stream: sstenant-00xxx
preferences:
  update_policy: prompt
```
 
### 2.1 Create pipeline template

In order to easily integrate Speedscale into your CICD, the best way of doing to is using calling a pipeline template

`speedscale.yml`:
```yaml
### Speedscale tests template

parameters:
  k8s_deployment: forgot-to-pass-param
  k8s_namespace: forgot-to-pass-param
  service_connection: forgot-to-pass-param
  speedscale_api_key: forgot-to-pass-param
  speedscale_scenario_id: forgot-to-pass-param
  speedscale_testconfig_id: forgot-to-pass-param
  speedscale_cleanup: false
  speedscale_tag: forgot-to-pass-param

steps:
  # Get Kubectl
  - task: KubectlInstaller@0
    displayName: 'speedscale - Kubectl Installed'
    inputs:
      kubectlVersion: 'latest'

  # Get speedscale cli
  # https://docs.speedscale.com/install/cli-speedctl/
  - bash: |
      ls -l
      # Copy config so speedscale can work
      echo "> Copy config"
      mkdir ~/.speedscale
      cp config.yaml ~/.speedscale/config.yaml

      # Replace the apikey
      echo "> Replacing the API Key"
      sed -i 's|apiKeyPlaceholder|${{ parameters.speedscale_api_key }}|g' ~/.speedscale/config.yaml

      if [[ -f ~/.speedscale/config.yaml ]]; then
       cat ~/.speedscale/config.yaml
      else
       echo "ERROR: ~/.speedscale/config.yaml not exists"
       exit 1
      fi

      # Download speedscale CLI
      sh -c "$(curl -Lfs https://downloads.speedscale.com/speedctl/install)"

      # Validate speedscale config
      echo "> Validating speectl config"
      cd ~/.speedscale && ls -l
      ~/.speedscale/speedctl check
    displayName: 'speedscale - Install cli'

  # Patch the deployment
  - task: KubernetesManifest@0
    displayName: 'speedscale - Patch the deployment - ${{ parameters.k8s_deployment }}'
    inputs:
      action: 'patch'
      kubernetesServiceConnection: ${{ parameters.service_connection }}
      namespace: ${{ parameters.k8s_namespace }}
      resourceToPatch: 'name'
      kind: 'deployment'
      mergeStrategy: 'strategic'
      name: ${{ parameters.k8s_deployment }}
      patch: |
        metadata:
          annotations:
            replay.speedscale.com/snapshot-id: "${{ parameters.speedscale_scenario_id }}"
            replay.speedscale.com/testconfig-id: "${{ parameters.speedscale_testconfig_id }}"
            replay.speedscale.com/cleanup: "${{ parameters.speedscale_cleanup }}"
            replay.speedscale.com/build-tag: "${{ parameters.speedscale_tag }}"
            sidecar.speedscale.com/inject: "true"

  # Get the test report results and show them
  - bash: |
      echo "> Going to find report for run with tag: ${{ parameters.speedscale_tag }}"

      i=0
      # Wait up to 10 minutes
      retries=60

      # Loop until report_id is not null, so we can get the report resuls
      while [ $i -le $retries ]
      do
        # Try to get newest report ID
        REPORT_ID=$(~/.speedscale/speedctl get reports --tag ${{ parameters.speedscale_tag }} | jq -r '.records[0].Id')

        # Check if report_id is published (not null), if not wait 10 seconds and check again
        if [[ "$REPORT_ID" != "null" ]]
        then
          echo "> Report ID published!"
          echo $REPORT_ID
          break
        else
          echo "> Report ID not published yet, waiting 10 seconds..."
          sleep 10
        fi

        # Fail the pipeline in case waiting for report_id takes so long
        ((i++))
        if [ $i -eq $retries ]
        then
          echo "> Timed out waiting for the report ID"
          exit 1
        fi
      done

      echo "Getting report ${REPORT_ID}"
      ~/.speedscale/speedctl wait report --timeout 20m "${REPORT_ID}"
      report_status=$(~/.speedscale/speedctl get report "${REPORT_ID}" | jq -r .report.status)
      echo "Report stasus is $report_status"
      case "${report_status}" in
        "Complete"|"Passed"|"Stopped")
        echo "> Tests passed with status: ${report_status}"
        ;;
        "Missed Goals"|"Error")
        echo "> Speedscale tests failed. Report status ${report_status} "
        exit 1
        ;;
        *)
        echo "> Unexpected error occured. Report status: ${report_status} "
        exit 1
      esac
    displayName: 'speedscale - Get report results'
```

### 2.2 Call pipeline template


Inputs explained
- **k8s_deployment**
  - Name of the deployment that should be tested by Speedscale
- **k8s_namespace**
  - Namespace where this deployment sits
- **service_connection**
  - Name of the AZDO Service connection to your Kubernetes cluster
- **speedscale_api_key**
  - Speedscale API Key - This should be handled as secret (e.g. load from Key Vault)
- **speedscale_scenario_id**
  - Speedscale Snapshot ID which should be used in the test
- **speedscale_testconfig_id**
  - Speedscale Test Config ID (etc. standard, performance_10replicas, chaos_10pct)
- **speedscale_cleanup**
  - Whether deployment should be removed after tests, it's especially useful in merge requests
- **speedscale_tag**
  - Used to link the Speedscale run to relevant report (and possibly build)

Calling the template within your pipeline
```yaml
steps:  # Run Speedscale here
  - template: speedscale.yml
    parameters:
      k8s_deployment: replace-with-deployment-name
      k8s_namespace: replace-with-namespace
      service_connection: replace-with-service-connection
      speedscale_api_key: replace-with-api-key
      speedscale_scenario_id: replace-with-scenario-id
      speedscale_testconfig_id: replace-with-test-config-id
      speedscale_tag: $(Build.BuildId)  # Proposed way is to use BuildID predefined variable 
```

