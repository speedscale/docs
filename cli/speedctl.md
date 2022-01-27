---
description: Your friendly command line tool for working with Speedscale cloud.
---

# speedctl

### About

The `speedctl` CLI tool is used to interact with the Speedscale cloud, and requires an active Speedscale subscription.  If you don't have an account with Speedscale the [speedscale CLI tool](speedscale/) is fully free, with a limited set of functionality.

`speedctl` is the Speedscale API.  Use `speedctl` to programmatically get reports, create snapshots, update configs, etc.

### Version

You may want to double check what version you are running, that can be accomplished with the simple `version` command. It will also show when it was compiled so you can decide if you need an update.

```
speedctl version
```

The output looks like this:

```
speedctl version v0.5.5 compiled at 2021-05-13T18:41:31+0000
```

### Update

Here is how to download a new version, it will update the binary in your `~/.speedscale` directory.

```
curl -sL https://downloads.speedscale.com/speedctl/install | bash
```

The output looks like this:

```
Checking if you are running the latest speedctl.
* Comparing checksum...
* The checksum was different.
Downloading speedctl-darwin...
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 40.7M  100 40.7M    0     0  22.7M      0  0:00:01  0:00:01 --:--:-- 22.7M
Download complete!
* Comparing checksum...
* The checksum was the same.
speedctl was successfully installed 🎉
```

### Help

You can figure out what commands are available by adding `--help` to the end of the current command. For example just running help itself will have this kind of output (don't be surprised if yours is different, new features pop up all the time):

```
speedctl --help
```

The output looks like this:

```
speedctl handles common operations for deploying, and maintaining, and interacting
with Speedscale resources and services.  Most commands are run in conjunction with kubectl.

Usage:
  speedctl [command]

Available Commands:
  act          Execute scenario actions manually
  check        Prints config to help make sure that the config file syntax is correct
  completion   Generates completion scripts for bash or zsh
  controlplane Deploys Speedscale control plane services
  creds        Deploys ONLY credentials
  delete       Deletes resources from Speedscale database
  generator    Deploys generator ONLY with dependent services
  get          Retrieve resources from Speedscale database
  help         Help about any command
  init         Initializes speedctl configuration
  inject       Inject Speedscale sidecar to Kubernetes pod resources
  operator     Deploys the Speedscale operator to a cluster
  put          Insert resources into Speedscale database
  report       Manages report artifacts in the Speedscale datastore
  responder    Deploys responder ONLY with dependent services
  snapshot     Manages snapshot artifacts in the Speedscale datastore
  tenantinfo   Retrieves tenant info from Speedscale service
  testconfig   Manages test config artifacts in the Speedscale datastore
  tokenconfig  Manages token config artifacts in the Speedscale datastore
  uninject     Uninject Speedscale sidecar from Kubernetes pod resources
  version      Prints current version

Flags:
      --app-url string   URL of the speedscale app
      --config string    Config file (default ${HOME}/.speedscale/config.yaml)
  -c, --context string   Uses a specific context from those listed in ${HOME}/.speedscale/config.yaml
  -h, --help             help for speedctl
  -v, --verbose          Verbose output

Use "speedctl [command] --help" for more information about a command.
```

### Flags

Note that the flags can be used to modify the command that is being sent. Each different command has it's own flags, for example here is how to get more information about the `init` command:

```
speedctl init --help
```

The output looks like this:

```
Initializes speedctl by authorizing your account and downloading your account config.yaml file

Usage:
  speedctl init [flags]

Aliases:
  init, initialize, bootstrap

Flags:
  -f, --force   Force install with default values
  -h, --help    help for init
```

Note that there is just one option which is `--force` which automatically supplies all the defaults if you don't want to answer all the questions from the init command.
