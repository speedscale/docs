---
description: "Use the ${{secret:name/key}} syntax to inject sensitive values like database credentials, JWT signing keys, and API tokens into proxymock transforms without storing them in your recording."
sidebar_position: 8
---

# Secrets

Recorded traffic often contains credentials that differ between environments — database passwords, JWT signing keys, AWS access keys. The `${{secret:name/key}}` syntax lets proxymock resolve these values from local files at runtime, so transforms can re-sign tokens or re-authenticate connections without hardcoding secrets into your recording or blueprint.

## Directory layout

proxymock discovers secrets automatically by walking up from your `--in` directory. Place a `secrets/` directory alongside (or inside) your `proxymock/` workspace:

```
my-project/
├── proxymock/
│   ├── secrets/                    ← preferred location
│   │   ├── mongo-creds/
│   │   │   ├── host
│   │   │   ├── username
│   │   │   └── password
│   │   └── jwt-signing/
│   │       └── key
│   └── recorded-2026-06-01T120000Z/
│       └── ...
```

Each secret is a plain file whose contents are the value. For example, `secrets/mongo-creds/password` might contain `s3cret123` with no trailing newline.

An alternative layout places `secrets/` one level up from `proxymock/`:

```
my-project/
├── secrets/
│   └── mongo-creds/
│       └── ...
└── proxymock/
    └── recorded-.../
```

Both layouts work. proxymock checks `<workspace>/proxymock/secrets/` first, then `<workspace>/secrets/`.

## Referencing secrets in transforms

Use the `${{secret:name/key}}` syntax in transform configuration fields that accept secret references. The `name` maps to the directory and `key` maps to the filename inside it.

### MongoDB SASL authentication

The `sasl_auth` transform re-authenticates MongoDB connections using SCRAM. Point each field at the appropriate secret file:

```json
{
  "type": "sasl_auth",
  "config": {
    "host":     "${{secret:mongo-creds/host}}",
    "username": "${{secret:mongo-creds/username}}",
    "password": "${{secret:mongo-creds/password}}"
  }
}
```

This resolves to `secrets/mongo-creds/host`, `secrets/mongo-creds/username`, and `secrets/mongo-creds/password` on disk.

For multiple MongoDB hosts, add one `sasl_auth` transform per host, each referencing its own secret directory.

### JWT re-signing

The `jwt_resign` transform re-signs JWT tokens using a local key:

```json
{
  "type": "jwt_resign",
  "config": {
    "secretPath": "${{secret:jwt-signing/key}}"
  }
}
```

### AWS Signature V4

The `aws_auth` transform re-signs AWS requests:

```json
{
  "type": "aws_auth",
  "config": {
    "secretPath": "${{secret:aws-creds/secret}}",
    "idPath":     "${{secret:aws-creds/id}}"
  }
}
```

## CLI usage

No extra flags are needed. When you run `proxymock mock` or `proxymock replay`, the secrets directory is discovered automatically from the `--in` path:

```bash
proxymock replay --in ./proxymock/recorded-2026-06-01T120000Z
```

proxymock walks up from the `--in` directory looking for a `secrets/` folder. If it finds one, all `${{secret:name/key}}` references in your transforms resolve against it.

## Security notes

- **Never commit secrets to version control.** Add `secrets/` to your `.gitignore`.
- Path traversal is blocked — references like `${{secret:../etc/passwd}}` are rejected and treated as a missing file.
- In Kubernetes, the Speedscale operator mounts secrets from the cluster's secret store. The local `secrets/` directory is only used for out-of-cluster (CLI) runs.

## Troubleshooting

**Transform fails with "file not found" for a secret path**
The `secrets/` directory wasn't discovered. Verify the directory exists and is reachable by walking up from your `--in` path. The directory must be named exactly `secrets` (not `.secrets` or `_secrets`).

**Secret value has unexpected whitespace**
Secret files are read as-is. Make sure the file doesn't contain a trailing newline. On macOS/Linux:

```bash
printf 's3cret123' > secrets/mongo-creds/password
```

Using `echo` adds a trailing newline by default — use `printf` or `echo -n` instead.
