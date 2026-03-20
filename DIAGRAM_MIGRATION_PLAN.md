# Diagram Migration Plan: Excalidraw/PNG → Mermaid

Migrate all architecture and workflow diagrams from static PNG/SVG/excalidraw images to inline Mermaid diagrams. Screenshots of UI are **not** in scope — only architectural, flow, and conceptual diagrams.

## Completed

- [x] **Deployment Architecture** — `docs/reference/architecture.md`
  - Replaced `common.png`, `ingest.png`, `replay.png` with mermaid
  - Added eBPF DaemonSet to capture diagrams and text
  - Updated DLP diagram to include nettap

## Remaining Pages

### Installation / Platform Diagrams

| # | Page | File | Diagram(s) to Replace |
|---|------|------|-----------------------|
| 1 | ECS Fargate | `docs/getting-started/installation/install/ecs.md` | `./ecs/arch.png` (architecture overview) |
| 2 | Google Cloud Run | `docs/getting-started/installation/install/cloudrun.md` | `./cloudrun/arch.png` (architecture overview) |
| 3 | Sidecar Install | `docs/getting-started/installation/sidecar/install.md` | `./tls/sidecar.png` (sidecar proxy diagram) |

### Guides — Capture & Replay

| # | Page | File | Diagram(s) to Replace |
|---|------|------|-----------------------|
| 4 | Cluster Inspector | `docs/guides/capture/infra.md` | `./infra/architecture.png` (cluster inspector architecture) |
| 5 | Via Kubernetes | `docs/guides/replay/kube.md` | `./test-architecture.png` (replay test architecture) |
| 6 | Browser Capture & Replay | `docs/guides/browser.md` | `./browser/firefox-speedctl.png` (capture flow diagram). Also delete orphaned `firefox-speedctl.excalidraw` |
| 7 | Record from Local Desktop | `docs/guides/local-capture.md` | `./local-capture/demo_arch.png` (local capture architecture) |
| 8 | Speedscale on the CLI | `docs/guides/cli.md` | `./cli/capture-flow.png`, `./cli/replay-flow.png` |

### Guides — Other

| # | Page | File | Diagram(s) to Replace |
|---|------|------|-----------------------|
| 9 | Signature Refinement | `docs/guides/signature-refinement-guide.md` | ASCII art / pseudo-diagram tables (review and convert to mermaid where a real diagram adds value) |

### Homepage

| # | Page | File | Diagram(s) to Replace |
|---|------|------|-----------------------|
| 10 | Homepage Observe Section | `docs/getting-started/introduction.md` | Review observe-section images — replace architectural diagrams with mermaid, keep UI screenshots |

### Reference

| # | Page | File | Diagram(s) to Replace |
|---|------|------|-----------------------|
| 11 | Replay Data Model | `docs/reference/replay_data_model.md` | `./replay_data_model/replay_data_model.png` |

### ProxyMock

| # | Page | File | Diagram(s) to Replace |
|---|------|------|-----------------------|
| 12 | Quickstart CLI | `docs/proxymock/getting-started/quickstart/quickstart-cli.md` | Review — may be UI screenshots rather than diagrams |
| 13 | Quickstart MCP | `docs/proxymock/getting-started/quickstart/quickstart-mcp.md` | Review — may be UI screenshots rather than diagrams |
| 14 | ProxyMock Architecture | `docs/proxymock/how-it-works/architecture.md` | `.svg` architecture diagrams (imported as React components): `app-no-proxymock.svg`, `app-capturing-outbound.svg`, `app-capturing-inbound.svg`, `app-with-mocks.svg`, `app-with-load-generator.svg` |
| 15 | ProxyMock How It Works | `docs/proxymock/how-it-works/index.md` | Review for any ASCII art or pseudo-diagrams |

## Guidelines

- **Replace** only architectural/flow/conceptual diagrams — keep UI screenshots as PNG
- **Use mermaid** `graph TD`, `graph LR`, `sequenceDiagram`, or `flowchart` as appropriate
- **Include eBPF DaemonSet** alongside sidecar in any capture/ingest diagrams
- **Delete** orphaned image files and excalidraw source files after replacement
- **Test** with `yarn build` after each page change
