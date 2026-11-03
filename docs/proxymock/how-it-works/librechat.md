---
title: "Use proxymock with LibreChat"
description: "Add the proxymock MCP server to a LibreChat deployment, with native stdio and Docker setups, workspace selection, and network access."
sidebar_position: 8
---

# Use proxymock with LibreChat

`proxymock mcp install --librechat-config` adds a `proxymock` entry under `mcpServers` in a LibreChat `librechat.yaml`. Use it for one trusted deployment at a time.

## Before you install

LibreChat is a shared server, and `mcpServers` applies to the whole deployment. Every LibreChat user who can use proxymock shares one workspace and one Speedscale identity, including its cloud replay and cluster tools. Install proxymock only in a deployment where all of those users could already use that identity, such as a single team's instance.

`proxymock mcp run --http` listens on all interfaces without authentication. Limit access to its port with a firewall or Docker network.

## How the installer selects a deployment

The installer writes to `librechat.yaml` only when you name it with `--librechat-config`, because the file may belong to a running deployment and already hold a working entry. That flag selects only LibreChat, so your other AI clients are not changed.

If you run `proxymock mcp install` or `proxymock init` in a directory containing `librechat.yaml`, proxymock leaves the file alone and prints the command to run instead.

## Native LibreChat with stdio

Name the configuration file and the workspace proxymock should use:

```sh
proxymock mcp install --librechat-config /path/to/librechat.yaml --librechat-work-dir /absolute/path/to/workspace
```

The installer asks before writing. Add `--yes` for unattended installation. The result looks like this:

```yaml
mcpServers:
  proxymock:
    type: stdio
    command: /absolute/path/to/proxymock
    args:
      - mcp
    cwd: /absolute/path/to/workspace
```

The workspace is required for stdio, because proxymock would otherwise run in LibreChat's own directory. If the entry already has a `cwd`, you can leave out the flag and the installer keeps it. LibreChat must be able to run the binary and read the workspace and any Speedscale credentials proxymock needs.

Restart LibreChat, enable proxymock in its MCP settings, and call `list_running` to check the connection.

## LibreChat in Docker with Streamable HTTP

Start the server on a machine LibreChat can reach:

```sh
proxymock mcp run --http --port 9091 --work-dir /absolute/path/to/workspace
```

Then configure the URL as LibreChat sees it, including the matching port:

```sh
proxymock mcp install --librechat-config /path/to/librechat.yaml --http --librechat-url http://host.docker.internal:9091/mcp --yes
```

This writes `type: streamable-http` and `url`, with no local process fields. `--librechat-url` affects LibreChat only. Without it, the URL is `http://localhost:7799/mcp`, or the port you set with `--port`, which from inside a container is the container itself, so pass `--librechat-url` every time you install for a Docker deployment. Legacy `--sse` writes `type: sse` and a `/sse` URL. Prefer `--http` for new setups.

Docker Desktop provides `host.docker.internal`. Linux Docker may need `extra_hosts: ["host.docker.internal:host-gateway"]` in Compose. Use the service hostname when the server runs in another container.

A macOS or Windows proxymock binary cannot run inside a Linux container. To use stdio in a container, install a Linux proxymock binary there and use container paths for the binary, workspace, and credentials.

Mount your YAML file into the LibreChat API container, normally at `/app/librechat.yaml` or its configured `CONFIG_PATH`. The installer replaces the file atomically, so a single-file bind mount keeps the old file until you recreate the container:

```sh
docker compose up -d --force-recreate api
```

Depending on your LibreChat version and its MCP network policy, you may need to allow the endpoint in `mcpSettings`. The installer does not change network policy. Recent versions support a private-host exemption:

```yaml
mcpSettings:
  allowedAddresses:
    - host.docker.internal:9091
```

If your deployment uses `allowedDomains` as an explicit allowlist, add the endpoint there and keep its existing entries.

## What the installer changes

The installer manages `type`, `command`, `args`, `cwd`, and `url` on the `proxymock` entry. Other servers, deployment settings, and compatible proxymock settings such as timeouts and server instructions are kept.

Switching transports removes settings the new transport cannot use. Moving to HTTP or SSE removes `command`, `args`, `env`, `cwd`, and `stderr`. Moving to stdio removes `url`, `headers`, and the OAuth, API key, and proxy settings. An empty file gets the required `version: 1.3.18`, and an existing version is never changed.

The file is rewritten as normalized YAML. Settings and comments are kept, but blank lines can be removed and comments can be re-indented, so review the diff if you keep this file in version control.

Existing file permissions are kept and the write is atomic. The installer leaves the file untouched and reports an error for malformed YAML, duplicate keys, multiple YAML documents, or incompatible mapping shapes. It also stops on anchors, aliases, or merges on the path it edits, and on anchors in settings it would remove. Expand those by hand and run it again.

## Related

- [Model Context Protocol (MCP)](./mcp.md)
- [MCP Tools & Prompts Reference](./mcp-tools.md)
- [LibreChat MCP server options](https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/mcp_servers)
- [LibreChat MCP network policy](https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/mcp_settings)
