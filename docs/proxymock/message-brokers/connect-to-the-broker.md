---
title: Connect to the broker
description: "Give a proxymock or Speedscale replay the credentials and TLS settings to publish to a Kafka, RabbitMQ, Amazon MQ, Google Pub/Sub or Redis broker, with secret references that keep passwords out of test configs and reports."
---

# Connect to the broker

A replay that [tests a consumer](./test-a-consumer.md) publishes to a real broker with its own connections, so it needs its own login. It never reuses the credentials your app authenticated with when you recorded. The settings go in the test config's `generator` section, one block per broker, and a few of them can come from your machine's environment instead:

| Broker | Test config section | Fields | From the environment |
|---|---|---|---|
| Kafka | `generator.kafka` | `username`, `password`, `saslMechanism`, `tlsMode` | Nothing |
| RabbitMQ and Amazon MQ | `generator.amqp` | `username`, `password`, `database` (the virtual host), `tlsMode` | Nothing |
| Google Pub/Sub | `generator.pubsub` | `republish`, `subscriptionTopics`, `credentialsJson`, `credentialsFile`, `endpoint`, `emulatorHost` | Application Default Credentials and `PUBSUB_EMULATOR_HOST` |
| Redis | `generator.redis` | `username`, `password`, `database`, `tlsMode`, `connectTimeout` | `REDISCLI_AUTH` |

The address to publish to comes from `--test-against`, or from the recording when you leave it out. Credentials in an address are not used: for Redis they are rejected, and for AMQP only the host and port of an `amqp://` or `amqps://` address apply.

A mock that stands in for the broker needs credentials only for Kafka SCRAM, in `responder.kafka`; see [Mock a broker](./mock-a-broker.md#kafka).

## Use a secret reference {#secret-references}

Any of the `username`, `password` and `database` fields, and `credentialsJson`, can hold a secret reference such as `${{secret:kafka-credentials/password}}` in place of the value. Prefer one for every password: a typed password is saved in plain text with the test config and every report that uses it, and the replay logs a warning when it sees one.

The reference names the secret and the key inside it. Where it is read from depends on where the replay runs:

| Where the replay runs | What `${{secret:kafka-credentials/password}}` reads |
|---|---|
| proxymock on your machine | The file `proxymock/secrets/kafka-credentials/password` in your workspace. See [Secrets](../guides/secrets.md). |
| A Kubernetes cluster: the Speedscale dashboard, `proxymock cloud replay` or `proxymock cluster replay` | The key `password` of the Kubernetes Secret `kafka-credentials`, in the namespace the replay runs in. Files in `proxymock/secrets` are not uploaded. |

Create the secret first. On your machine, write the value to a file, and keep `proxymock/secrets` out of version control:

```bash
mkdir -p proxymock/secrets/kafka-credentials
printf '%s' '<password>' > proxymock/secrets/kafka-credentials/password
```

For a replay in a cluster, create a Kubernetes Secret in the replay namespace:

```bash
kubectl create secret generic kafka-credentials --from-literal=username='<user>' --from-literal=password='<password>' -n <namespace>
```

Speedscale mounts every Secret that the `generator` and `responder` credential blocks and `generator.pubsub.credentialsJson` reference into the replay, so the Secret only has to exist in the namespace of the workload you replay. A reference that is malformed, or names a secret that cannot be read, stops the replay before it publishes anything.

## Kafka {#kafka}

```json
{
  "generator": {
    "kafka": {
      "username": "${{secret:kafka-credentials/username}}",
      "password": "${{secret:kafka-credentials/password}}",
      "saslMechanism": "PROTOCOL_SASL_MECHANISM_SCRAM_SHA_512",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

- `saslMechanism` is `PROTOCOL_SASL_MECHANISM_PLAIN`, `PROTOCOL_SASL_MECHANISM_SCRAM_SHA_256` or `PROTOCOL_SASL_MECHANISM_SCRAM_SHA_512`. Leave it out to connect without SASL. A mechanism needs a username. OAUTHBEARER and AWS IAM authentication for Amazon MSK are not supported.
- Before any load starts, the replay connects to the broker and checks that it answers, so a wrong address or login stops the replay at once.
- For Azure Event Hubs through its Kafka endpoint, use `PROTOCOL_SASL_MECHANISM_PLAIN` with the username `$ConnectionString`, the namespace's connection string as the password, and `PROTOCOL_TLS_MODE_VERIFY_FULL`.

| `tlsMode` | What it does |
|---|---|
| Unset, `PROTOCOL_TLS_MODE_DISABLE`, `PROTOCOL_TLS_MODE_ALLOW` or `PROTOCOL_TLS_MODE_PREFER` | Plaintext |
| `PROTOCOL_TLS_MODE_REQUIRE` | TLS, without checking the broker's certificate, for a test broker with a self-signed certificate |
| `PROTOCOL_TLS_MODE_VERIFY_CA` or `PROTOCOL_TLS_MODE_VERIFY_FULL` | TLS, checking the broker's certificate against the system's trusted CAs |

## RabbitMQ and Amazon MQ {#rabbitmq}

```json
{
  "generator": {
    "amqp": {
      "username": "${{secret:rabbitmq-credentials/username}}",
      "password": "${{secret:rabbitmq-credentials/password}}",
      "database": "orders",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

- The replay logs in with PLAIN. Without a username it logs in as `guest` with the password `guest`, as RabbitMQ clients do. A password needs a username.
- `database` names the virtual host, and `/` is used when it is unset.
- Amazon MQ accepts only AMQPS, so set a `tlsMode`. It presents a certificate from a public CA, so `PROTOCOL_TLS_MODE_VERIFY_FULL` works without extra setup. Without a `tlsMode` the replay connects without TLS, which Amazon MQ refuses.

| `tlsMode` | What it does |
|---|---|
| Unset, `PROTOCOL_TLS_MODE_DISABLE`, `PROTOCOL_TLS_MODE_ALLOW` or `PROTOCOL_TLS_MODE_PREFER` | Plaintext |
| `PROTOCOL_TLS_MODE_REQUIRE` | AMQPS, without checking the broker's certificate |
| `PROTOCOL_TLS_MODE_VERIFY_CA` or `PROTOCOL_TLS_MODE_VERIFY_FULL` | AMQPS, checking the broker's certificate against the system's trusted CAs |

## Google Pub/Sub {#google-pubsub}

```json
{
  "generator": {
    "pubsub": {
      "republish": true,
      "credentialsJson": "${{secret:pubsub-replay/key.json}}",
      "subscriptionTopics": {
        "projects/shop/subscriptions/orders-worker": "projects/shop-staging/topics/orders"
      }
    }
  }
}
```

**Credentials.** Without credentials in the test config, the replay uses Application Default Credentials, such as Workload Identity on GKE, the file `GOOGLE_APPLICATION_CREDENTIALS` names, or `gcloud auth application-default login` on your machine. To use a key file instead, set one of:

- `credentialsJson`, the content of the file. Use a secret reference: in a cluster, Speedscale mounts the secret into the generator. Do not paste the key itself.
- `credentialsFile`, the path of the file on the machine the replay runs on, for proxymock. It takes a path, not a secret reference.

Set one or the other, not both. Service account, authorized user, impersonated service account and external account files are accepted; a file of another type is refused.

**Permissions.** The topic is looked up from the subscription with `GetSubscription`, so the replay's credentials need `pubsub.subscriptions.get` on the subscription and `pubsub.topics.publish` on the topic. To publish to another topic, or when the replay cannot read the subscription, map the subscription to a topic in `subscriptionTopics`, with full names. A subscription whose topic was deleted must be mapped.

**Endpoint.** The replay publishes over TLS to `pubsub.googleapis.com:443`. Set `endpoint` to a `host:port` such as `us-east1-pubsub.googleapis.com:443` to publish through a regional endpoint.

**Emulator.** Set `emulatorHost` to the emulator's `host:port`, or set the `PUBSUB_EMULATOR_HOST` environment variable as the Google client libraries do. The emulator is reached in plaintext without credentials, and it wins over `endpoint` and any credentials.

## Redis {#redis}

The address is `redis://host:port/db`, or `rediss://host:port/db` for TLS. The path is the logical database the replay selects, and it defaults to 0. Credentials in the address are rejected so they never end up in shell history or reports. The replay never sends the recording's own `AUTH` or `HELLO` credentials.

| Where | What to set |
|---|---|
| Your machine | The `REDISCLI_AUTH` environment variable, which `redis-cli` reads too |
| The test config | `generator.redis`: `username` (an ACL user, empty for the default user), `password`, `database`, `tlsMode` and `connectTimeout` |

```json
{
  "generator": {
    "redis": {
      "username": "replay",
      "password": "${{secret:redis-creds/password}}",
      "database": "0",
      "tlsMode": "PROTOCOL_TLS_MODE_REQUIRE"
    }
  }
}
```

The test config wins over `REDISCLI_AUTH`, and the database in the address wins over the test config. Before any load starts, the replay connects once to each Redis server and sends `PING`, so a wrong password stops the replay straight away with the server's `WRONGPASS` or `NOAUTH` message.

| `tlsMode` | What it does |
|---|---|
| Unset, `PROTOCOL_TLS_MODE_DISABLE` or `PROTOCOL_TLS_MODE_ALLOW` | Plain text, unless the address is `rediss://`, which means `PROTOCOL_TLS_MODE_REQUIRE` |
| `PROTOCOL_TLS_MODE_PREFER` | Tries TLS and falls back to plain text when the handshake fails |
| `PROTOCOL_TLS_MODE_REQUIRE` | Always encrypts, without checking the server's certificate |
| `PROTOCOL_TLS_MODE_VERIFY_CA` | Checks that a trusted CA signed the certificate |
| `PROTOCOL_TLS_MODE_VERIFY_FULL` | Also checks that the certificate names the host |

Amazon ElastiCache IAM authentication is not supported yet. Use a password or an ACL user and password. [Replay against Redis or Valkey](../databases/record/redis.md#replay) covers the rest of a Redis replay.

## Related

- [Test a consumer or a producer](./test-a-consumer.md)
- [Test configs](../guides/test-configs.md)
- [Secrets](../guides/secrets.md)
