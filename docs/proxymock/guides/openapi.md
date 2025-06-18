#  Generate Mocks from OpenAPI

## Overview

The OpenAPI to RRPair feature in proxymock allows you to instantly generate a complete set of mock API responses from any OpenAPI 3.0+ specification (JSON or YAML). This enables rapid prototyping, testing, and development without needing to manually record or handcraft mock data.

With a single command, you can convert your OpenAPI spec into a directory of RRPair markdown files. From therer you can use the `proxymock mock` server to respond and `proxymock inspect` to modify specific responses.

## Why Use This Feature?

- **Instant Mock Servers**: No need to record real traffic or write mocks by hand.
- **Consistent, Realistic Data**: Mock data is generated based on your API schema, with context-aware values.
- **Covers All Endpoints**: Every path, method, and status code in your spec is included.
- **Easy Customization**: Edit the generated files to fine-tune responses as needed.
- **Seamless Integration**: Works out-of-the-box with the `proxymock mock` command.

## Quick Start

### 1. Prepare Your OpenAPI Spec

Make sure you have an OpenAPI 3.0+ spec file (JSON or YAML). Example: `api-spec.yaml`

### 2. Run the Generation Command

```bash
proxymock generate api-spec.yaml
```

This will:
- Parse your OpenAPI spec
- Generate RRPair markdown files for every endpoint and status code
- Organize them in a directory like `proxymock/generated-20240611/api.example.com/`

### 3. Start the Mock Server

```bash
proxymock mock
```

Your mock server is now running and will respond to requests as defined in your OpenAPI spec!

---

## Command Reference

### Basic Usage

```bash
proxymock generate <openapi-spec-file>
```

### Common Flags

| Flag                        | Description                                                      |
|-----------------------------|------------------------------------------------------------------|
| `-o, --out <dir>`           | Output directory for generated files (default: timestamped dir)  |
| `--host <host>`             | Override the host for requests and output directory              |
| `--port <port>`             | Override the port (default: from spec or 80/443)                 |
| `--examples-only`           | Only generate responses with explicit examples                   |
| `--include-optional`        | Include optional properties in generated mock data               |
| `--include-paths <paths>`   | Comma-separated list of path patterns to include                 |
| `--exclude-paths <paths>`   | Comma-separated list of path patterns to exclude                 |
| `--tag-filter <tags>`       | Only generate endpoints with specific OpenAPI tags               |

### Examples

```bash
# Generate mocks from an OpenAPI YAML file
speedctl proxymock generate api-spec.yaml

# Output to a custom directory
speedctl proxymock generate -o ./mocks api-spec.json

# Only generate endpoints with explicit examples
speedctl proxymock generate --examples-only api-spec.yaml

# Include optional properties in mock data
speedctl proxymock generate --include-optional api-spec.yaml

# Filter by OpenAPI tags
speedctl proxymock generate --tag-filter "users,orders" api-spec.yaml
```

## What Gets Generated?

- **One RRPair file per endpoint and status code** (e.g., `GET_users_200.md`, `POST_users_400.md`)
- **Mock data** for requests and responses, based on your OpenAPI schemas
- **HTTP Prefer header** in requests (e.g., `Prefer: status=200`) to select the response status code
- **Host-based directory structure** (e.g., `proxymock/generated-20240611/api.example.com/`)
- **Filesystem-safe filenames** (special characters sanitized)

### Example Output Structure

```
proxymock/generated-20240611/
└── api.example.com/
    ├── GET_users_200.md
    ├── GET_users_404.md
    ├── POST_users_201.md
    └── ...
```

## How Does It Work?

1. **Parses your OpenAPI spec** (supports both JSON and YAML, OpenAPI 3.0+)
2. **Extracts all endpoints, methods, and response codes**
3. **Generates mock request and response data**:
   - Uses examples from your spec if available
   - Otherwise, generates realistic data based on schema types and field names
   - Optional properties included if `--include-optional` is set
4. **Creates RRPair markdown files** for each endpoint/status code combination
5. **Organizes files** by host, with safe filenames

## Best Practices

- **Edit as Needed**: After generation, you can hand-edit any RRPair file to fine-tune responses.
- **Use Prefer Header**: When testing, use the `Prefer: status=...` header to select which response you want.
- **Regenerate on Spec Changes**: Re-run the command whenever your OpenAPI spec changes to keep mocks up to date.
- **Combine with Recording**: Use alongside proxymock's traffic recording for even more realistic mocks.

## Troubleshooting

- **No Endpoints Generated?**
  - Check proxymock log output for errors
  - Check your OpenAPI spec for valid paths and methods.
  - Use `--include-paths` or `--tag-filter` to control which endpoints are included.

- **Errors During Generation?**
  - The tool will print detailed error messages for any issues in your spec.
  - Generation continues for other endpoints even if some fail.

- **Mock Data Looks Generic?**
  - Add `example` or `default` values to your OpenAPI schemas for more realistic output.
  - Use `--include-optional` to add more fields to the mock data.
  - Copy/paste RRPair files and modify to give more detailed responses

## FAQ

**Q: What OpenAPI versions are supported?**  
A: OpenAPI 3.0 and above (JSON or YAML).

**Q: Can I use this with Swagger 2.0?**  
A: Not yet. Let us know if you need this on our [community](https://slack.speedscale.com).

**Q: Are the generated mocks production-ready?**  
A: Yes! The output is fully compatible with `proxymock mock` and can be used for development, testing, and CI/CD.

**Q: How do I customize the generated responses?**  
A: Simply edit the markdown files after generation. You can change any part of the request or response.

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Proxymock RRPair Markdown Format](https://docs.speedscale.com/proxymock/how-it-works/rrpair-format/)

## Summary

The OpenAPI to RRPair feature is fast way to turn your API specification into a working mock server. It's ideal for rapid development, testing, and continuous integration. Try it out today and accelerate your API workflows! Proxymock paid tier plans allow running the mock server in Kubernetes or other long lived environments.

If you have questions or feedback, please reach out to the proxymock team in our [community](https://slack.speedscale.com).
