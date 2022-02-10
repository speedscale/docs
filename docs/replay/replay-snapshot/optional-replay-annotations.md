---
sidebar_position: 1 
---

# Optional Replay Annotations

Just add annotations to your deployment and the operator will take care of the
rest.

Here are additional annotations for customizing your replay

| Annotation                             | Description                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.speedscale.com/tag`              | Link a unique tag, build hash, etc. to the Speedscale report. That way you can connect the report results to the version of the code that was tested. |
| `test.speedscale.com/deployResponder`  | Set to `"true"` to deploy the responder. (default: false)                                                                                             |
| `test.speedscale.com/deployGenerator`  | Set to `"false"` to not deploy the generator (default: true)                                                                                          |
| `test.speedscale.com/secrets`          | Use this setting to provide a list of secrets for the replay system to load (ex: JWT passwords).                                                      |
| `test.speedscale.com/cleanup`          | Setting to `"false"`will not remove the system under test.                                                                                            |
| `test.speedscale.com/logCollection`    | Set to `"true"` to collect logs from the system under test (default: false).                                                                          |
| `test.speedscale.com/responderLowData` | Set to "true" to force the responder into a high efficiency/low data output mode. This is ideal for high volume performance tests.                    |

### Tag Annotation

Here a simple example from Gitlab where we use sed to insert the build tag into the yaml before deploying to the Kubernetes test cluster:

```
deploy_speedscale:
  stage: deploy
  image: gcr.io/google.com/cloudsdktool/cloud-sdk:latest
  script:
    - sed s/CIBuild/$(echo $CI_COMMIT_TAG)/g ./k8s/moto-api.yaml > ./k8s/moto-api-corrected.yaml
    - kubectl -n mototest1 apply -f ./k8s/moto-api-corrected.yaml
```

### Secret configuration

If your application uses short lived JWTs, you need to provide a JWT secret that Speedscale can use to resign tokens. For example, if your service receives HTTP calls that contain a JWT authorization with 10 minute expiration (exp) setting, that JWT will be invalid by the time it is used for replay. To solve this, add the following annotations (insert your own secret names):

```
test.speedscale.com/secrets: "jwtsecret,jwtsecret2,jwtsecret3"
```

This will cause the Kubernetes operator to add each secret (comma separated) to the generator. Note that you need to include the secret filename to the tokenizer configuration (ask Speedscale how to do this, it isn't in the docs yet). The filename for each secret in the tokenizer will be in the format

```
/home/speedscale/secret/SECRETNAME/SECRETFILENAME
```

### Environment Cleanup

The operator can be configured to automatically delete:

* The Speedscale created components (generator, responder, etc.)
* The System Under Test (i.e. your deployment)

You can stop this behavior to retain logs, etc by adding the following annotation to your deployment:

```
test.speedscale.com/cleanup: "false"
```

Leaving this option enabled (cleanup=false) is not recommended, because the generator and scenario will be cleaned up regardless.
