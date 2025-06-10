---
sidebar_position: 1
---

# Lifecycle

Using **proxymock** starts with recording
[traffic](/reference/glossary.md#traffic).  See the `proxymock record` command.
Recorded traffic is stored in files in the `proxymock` directory, relative to
wherever proxymock was run.

Traffic going to (tests), and coming from (mocks), your app can be recorded.
The recorded traffic that went to your app can be replayed with `proxymock
replay`.  The recorded traffic that went from your app to external resources can
be used to create a [mock server](#mock-server) with `proxymock mock`.

When running `proxymock replay` or `proxymock mock` new requests are also
recorded to the `proxymock` directory, unless disabled with a CLI flag.

## Mock Server Lifecycle

Speedscale's [mock server](/reference/glossary.md#mock-server) uses the outbound
(egress) traffic of your application to create a mock server.

Each request received by the mock server is translated into a
[signature](/proxymock/how-it-works/signature/) to make it quickly identifiable.
This is visible in mock files and can be modified to change the matching
criteria.

The signature is a map of identifiers which can be matched against incoming
requests. When a request matches the associated response is sent back to your
app.

## Updating the Mock Server

**proxymock** files will be read and automatically compiled every time a
**proxymock** command is run so files can be changed on the fly.  This means you
can change the details of a test or mock by modifying the appropriate file and
re-running **proxymock**. Request and response data can also be modified from
the `proxymock inspect`
[TUI](https://en.wikipedia.org/wiki/Text-based_user_interface).

## Sharing Tests and Mocks

Test and mock files can be shared directly by copying them between machines.
They can also be sent to the Speedscale cloud with the `proxymock cloud push
snapshot` command.  This creates a [snapshot](/reference/glossary.md#snapshot),
which is easily pulled to other machines, or can be used to create automated
replays in environments like Kubernetes which support such automation.

**proxymock** does support being embedded into a CI/CD pipeline but requires a
commercial license. You can learn more about `proxymock push` and `proxymock
pull` in the [Speedscale Enterprise](../../intro.md) documentation.
