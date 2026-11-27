---
title: Write your own load driver
description: "Extract recorded Kafka, RabbitMQ, Amazon SQS, SNS, Kinesis and Firehose messages from a Speedscale snapshot with speedctl extract data, and publish them with a small producer of your own in Go, Java, TypeScript or Python."
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Write your own load driver

Speedscale replays recorded deliveries to a real broker on its own for Kafka, RabbitMQ, Google Pub/Sub and Redis; see [Test a consumer](./test-a-consumer.md). Write your own load driver when you need full control over what is sent and when, such as editing message bodies, sending to a broker the replay cannot reach, or running the load from your own test harness.

The approach has two steps: extract the recorded messages from a snapshot into a CSV file, then publish each row with a small producer.

## Extract the messages {#extract}

`speedctl extract data` reads a snapshot, pulling it from Speedscale cloud if it is not on your machine, and writes one CSV row per recorded call. Give it one `--path` per column and turn off de-duplication, which otherwise keeps only one column of unique values:

```bash
speedctl extract data <snapshot-id> --dedup=false \
  --path kafka.response.FetchResponse.topics.0.partitions.0.records.records.0.valueString \
  --path ts \
  --filter '(command IS "Fetch")'
```

The output names the directory it writes to, under `~/.speedscale/data/userdata`. The CSV has a header row, then one row per call with each path's value and the call's RRPair UUID:

```csv
kafka.response.FetchResponse.topics.0.partitions.0.records.records.0.valueString,ts,RRPair UUID
"{""id"":1,""total"":10}",2026-01-15T10:30:45.123Z,44f7a2cc-2045-4fb6-9635-3da8aa7fa909
"{""id"":2,""total"":20}",2026-01-15T10:30:46.456Z,58f7a2cc-1135-4fa6-3433-ada5aa2fa161
```

A call that has no value for a path is left out. Add `--include-errors` to see why a path finds nothing, and `--regex` to keep only part of a value.

| Broker | Path to the message | Filter | The value is |
|---|---|---|---|
| Kafka, and Azure Event Hubs through its Kafka endpoint | `kafka.response.FetchResponse.topics.0.partitions.0.records.records.0.valueString` | `(command IS "Fetch")` | Text, when the record value is UTF-8 |
| RabbitMQ and Amazon MQ | `AmqpV091.server.basic.deliver.body` | `(command IS "Basic.Deliver")` | Base64 |
| Amazon SQS, with the JSON protocol current AWS SDKs use | `http.req.bodyBase64.MessageBody` | A filter on the queue's calls | Text |
| Amazon Kinesis Data Streams | `http.req.bodyBase64.Data` | A filter on the stream's calls | Base64, as the Kinesis API sends it. An SDK that sends CBOR instead of JSON, as the AWS SDK for Java does by default, needs the whole body. |
| Amazon Data Firehose | `http.req.bodyBase64.Record.Data` | A filter on the delivery stream's calls | Base64, as the Firehose API sends it |
| Amazon SNS, and anything else with a form or binary body | `http.req.bodyBase64` | A filter on the topic's calls | Base64 of the whole request body, for your driver to parse |

The paths name one field of one call. The Kafka path takes the first record of the first partition of each `Fetch`; change the indexes, or add more `--path` columns, for fetches that return several records. The HTTP paths read what your app sent, so a snapshot of a producer gives you its messages. `speedctl extract data --help` lists more examples.

Messages of protocols Speedscale does not decode, such as AMQP 1.0, the Pulsar binary protocol and OpenWire, are not in the recording, so there is nothing to extract for them.

## Write the producer {#producer}

Using the language of your choice, and an AI assistant if you like, write a producer that:

1. Reads the CSV and skips the header row.
1. Connects to the broker.
1. For each row, decodes the message body if it is base64.
1. Optionally waits the time between this row's timestamp and the previous one, to keep the recorded pacing.
1. Publishes the message.
1. Flushes and closes the connection.

The loop is the same for every broker. Each version below takes a `publish` function, shown per broker [below](#publish), and a flag to keep the recorded timing; without it, the driver sends as fast as the broker accepts.

<Tabs groupId="language">
<TabItem value="go" label="Go">

```go
package main

import (
	"encoding/base64"
	"encoding/csv"
	"io"
	"os"
	"time"
)

// replay publishes each row of the CSV that speedctl extract data wrote
func replay(path string, isBase64, respectTiming bool, publish func([]byte) error) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	r := csv.NewReader(f)
	if _, err := r.Read(); err != nil { // skip the header row
		return err
	}
	var last time.Time
	for {
		row, err := r.Read()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		body := []byte(row[0])
		if isBase64 {
			if body, err = base64.StdEncoding.DecodeString(row[0]); err != nil {
				return err
			}
		}
		if respectTiming && len(row) > 1 {
			ts, err := time.Parse(time.RFC3339Nano, row[1])
			if err != nil {
				return err
			}
			if !last.IsZero() && ts.After(last) {
				time.Sleep(ts.Sub(last))
			}
			last = ts
		}
		if err := publish(body); err != nil {
			return err
		}
	}
}
```

</TabItem>
<TabItem value="java" label="Java">

This version reads the CSV with [Apache Commons CSV](https://commons.apache.org/proper/commons-csv/), because message bodies can hold commas and quotes.

```java
import java.io.FileReader;
import java.io.Reader;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;

public class Replay {
    public interface Publisher {
        void publish(byte[] body) throws Exception;
    }

    // replay publishes each row of the CSV that speedctl extract data wrote
    public static void replay(String path, boolean isBase64, boolean respectTiming, Publisher publisher) throws Exception {
        try (Reader in = new FileReader(path)) {
            Instant last = null;
            boolean header = true;
            for (CSVRecord row : CSVFormat.DEFAULT.parse(in)) {
                if (header) { // skip the header row
                    header = false;
                    continue;
                }
                byte[] body = isBase64
                        ? Base64.getDecoder().decode(row.get(0))
                        : row.get(0).getBytes(StandardCharsets.UTF_8);
                if (respectTiming && row.size() > 1) {
                    Instant ts = Instant.parse(row.get(1));
                    if (last != null && ts.isAfter(last)) {
                        Thread.sleep(Duration.between(last, ts).toMillis());
                    }
                    last = ts;
                }
                publisher.publish(body);
            }
        }
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

This version reads the CSV with [csv-parse](https://csv.js.org/parse/), because message bodies can hold commas and quotes.

```typescript
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

// replay publishes each row of the CSV that speedctl extract data wrote
export async function replay(
  path: string,
  isBase64: boolean,
  respectTiming: boolean,
  publish: (body: Buffer) => Promise<void>,
): Promise<void> {
  const rows: string[][] = parse(fs.readFileSync(path), { from_line: 2 }); // skip the header row
  let last: number | undefined;
  for (const row of rows) {
    const body = isBase64 ? Buffer.from(row[0], 'base64') : Buffer.from(row[0], 'utf8');
    if (respectTiming && row.length > 1) {
      // Date keeps milliseconds, so drop any finer digits first
      const ts = new Date(row[1].replace(/(\.\d{3})\d+/, '$1')).getTime();
      if (last !== undefined && ts > last) {
        await new Promise((resolve) => setTimeout(resolve, ts - last!));
      }
      last = ts;
    }
    await publish(body);
  }
}
```

</TabItem>
<TabItem value="python" label="Python">

```python
import base64
import csv
import time
from datetime import datetime


def parse_ts(value):
    # recorded timestamps carry up to nine fractional digits; datetime keeps six
    value = value.rstrip("Z")
    if "." in value:
        whole, frac = value.split(".")
        value = f"{whole}.{frac[:6].ljust(6, '0')}"
    return datetime.fromisoformat(value)


def replay(path, publish, is_base64=False, respect_timing=False):
    """Publish each row of the CSV that speedctl extract data wrote."""
    with open(path, newline="") as f:
        reader = csv.reader(f)
        next(reader)  # skip the header row
        last = None
        for row in reader:
            body = base64.b64decode(row[0]) if is_base64 else row[0].encode()
            if respect_timing and len(row) > 1:
                ts = parse_ts(row[1])
                if last is not None and ts > last:
                    time.sleep((ts - last).total_seconds())
                last = ts
            publish(body)
```

</TabItem>
</Tabs>

## Publish to your broker {#publish}

Each snippet connects to the broker and defines the `publish` function the loop calls. Replace the names in angle brackets with your own, and call `replay` with the CSV path.

### Kafka and Azure Event Hubs {#kafka}

<Tabs groupId="language">
<TabItem value="go" label="Go">

```go
// github.com/confluentinc/confluent-kafka-go/v2/kafka
p, err := kafka.NewProducer(&kafka.ConfigMap{"bootstrap.servers": "<broker>:9092"})
if err != nil {
	return err
}
defer p.Close()
topic := "<topic>"
err = replay("out.csv", false, true, func(body []byte) error {
	return p.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
		Value:          body,
	}, nil)
})
p.Flush(15_000)
```

</TabItem>
<TabItem value="java" label="Java">

```java
// org.apache.kafka:kafka-clients
Properties props = new Properties();
props.put("bootstrap.servers", "<broker>:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.ByteArraySerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.ByteArraySerializer");
try (KafkaProducer<byte[], byte[]> producer = new KafkaProducer<>(props)) {
    Replay.replay("out.csv", false, true, body -> producer.send(new ProducerRecord<>("<topic>", body)));
    producer.flush();
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { Kafka } from 'kafkajs';

const producer = new Kafka({ brokers: ['<broker>:9092'] }).producer();
await producer.connect();
await replay('out.csv', false, true, async (body) => {
  await producer.send({ topic: '<topic>', messages: [{ value: body }] });
});
await producer.disconnect();
```

</TabItem>
<TabItem value="python" label="Python">

```python
from confluent_kafka import Producer

producer = Producer({"bootstrap.servers": "<broker>:9092"})
replay("out.csv", lambda body: producer.produce("<topic>", value=body), respect_timing=True)
producer.flush()
```

</TabItem>
</Tabs>

For Azure Event Hubs, connect to `<namespace>.servicebus.windows.net:9093` with `security.protocol=SASL_SSL`, `sasl.mechanism=PLAIN`, the username `$ConnectionString` and the namespace's connection string, from **Shared access policies** in the Azure portal, as the password. The event hub's name is the topic.

### RabbitMQ and Amazon MQ {#rabbitmq}

The recorded body is base64, so pass `true` for the base64 flag. Publish to the exchange and routing key the consumer reads through; an empty exchange with the queue's name as the routing key sends straight to that queue. For Amazon MQ, use an `amqps://` URL on port 5671.

<Tabs groupId="language">
<TabItem value="go" label="Go">

```go
// github.com/rabbitmq/amqp091-go
conn, err := amqp.Dial("amqp://<user>:<password>@<broker>:5672/")
if err != nil {
	return err
}
defer conn.Close()
ch, err := conn.Channel()
if err != nil {
	return err
}
err = replay("out.csv", true, true, func(body []byte) error {
	return ch.PublishWithContext(context.Background(), "<exchange>", "<routing-key>", false, false,
		amqp.Publishing{Body: body})
})
```

</TabItem>
<TabItem value="java" label="Java">

```java
// com.rabbitmq:amqp-client
ConnectionFactory factory = new ConnectionFactory();
factory.setUri("amqp://<user>:<password>@<broker>:5672/");
try (Connection connection = factory.newConnection(); Channel channel = connection.createChannel()) {
    Replay.replay("out.csv", true, true, body -> channel.basicPublish("<exchange>", "<routing-key>", null, body));
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import * as amqp from 'amqplib';

const connection = await amqp.connect('amqp://<user>:<password>@<broker>:5672/');
const channel = await connection.createChannel();
await replay('out.csv', true, true, async (body) => {
  channel.publish('<exchange>', '<routing-key>', body);
});
await channel.close();
await connection.close();
```

</TabItem>
<TabItem value="python" label="Python">

```python
import pika

connection = pika.BlockingConnection(pika.URLParameters("amqp://<user>:<password>@<broker>:5672/"))
channel = connection.channel()
replay(
    "out.csv",
    lambda body: channel.basic_publish(exchange="<exchange>", routing_key="<routing-key>", body=body),
    is_base64=True,
    respect_timing=True,
)
connection.close()
```

</TabItem>
</Tabs>

### Amazon SQS {#sqs}

<Tabs groupId="language">
<TabItem value="go" label="Go">

```go
// github.com/aws/aws-sdk-go-v2/config and service/sqs
cfg, err := config.LoadDefaultConfig(context.Background())
if err != nil {
	return err
}
client := sqs.NewFromConfig(cfg)
err = replay("out.csv", false, true, func(body []byte) error {
	_, err := client.SendMessage(context.Background(), &sqs.SendMessageInput{
		QueueUrl:    aws.String("<queue-url>"),
		MessageBody: aws.String(string(body)),
	})
	return err
})
```

</TabItem>
<TabItem value="java" label="Java">

```java
// software.amazon.awssdk:sqs
try (SqsClient sqs = SqsClient.create()) {
    Replay.replay("out.csv", false, true, body -> sqs.sendMessage(SendMessageRequest.builder()
            .queueUrl("<queue-url>")
            .messageBody(new String(body, StandardCharsets.UTF_8))
            .build()));
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});
await replay('out.csv', false, true, async (body) => {
  await sqs.send(new SendMessageCommand({ QueueUrl: '<queue-url>', MessageBody: body.toString('utf8') }));
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
import boto3

sqs = boto3.client("sqs")
replay(
    "out.csv",
    lambda body: sqs.send_message(QueueUrl="<queue-url>", MessageBody=body.decode()),
    respect_timing=True,
)
```

</TabItem>
</Tabs>

### Amazon SNS {#sns}

SNS `Publish` calls are form-encoded, so extract the whole body and take its `Message` parameter. SNS delivers each message to every subscription on the topic.

<Tabs groupId="language">
<TabItem value="go" label="Go">

```go
// github.com/aws/aws-sdk-go-v2/config and service/sns
cfg, err := config.LoadDefaultConfig(context.Background())
if err != nil {
	return err
}
client := sns.NewFromConfig(cfg)
err = replay("out.csv", true, true, func(body []byte) error {
	form, err := url.ParseQuery(string(body))
	if err != nil {
		return err
	}
	_, err = client.Publish(context.Background(), &sns.PublishInput{
		TopicArn: aws.String("<topic-arn>"),
		Message:  aws.String(form.Get("Message")),
	})
	return err
})
```

</TabItem>
<TabItem value="java" label="Java">

```java
// software.amazon.awssdk:sns
try (SnsClient sns = SnsClient.create()) {
    Replay.replay("out.csv", true, true, body -> {
        String message = "";
        for (String pair : new String(body, StandardCharsets.UTF_8).split("&")) {
            if (pair.startsWith("Message=")) {
                message = URLDecoder.decode(pair.substring("Message=".length()), StandardCharsets.UTF_8);
            }
        }
        sns.publish(PublishRequest.builder().topicArn("<topic-arn>").message(message).build());
    });
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({});
await replay('out.csv', true, true, async (body) => {
  const message = new URLSearchParams(body.toString('utf8')).get('Message') ?? '';
  await sns.send(new PublishCommand({ TopicArn: '<topic-arn>', Message: message }));
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
import boto3
from urllib.parse import parse_qs

sns = boto3.client("sns")
replay(
    "out.csv",
    lambda body: sns.publish(TopicArn="<topic-arn>", Message=parse_qs(body.decode())["Message"][0]),
    is_base64=True,
    respect_timing=True,
)
```

</TabItem>
</Tabs>

### Amazon Kinesis Data Streams {#kinesis}

The partition key decides which shard a record goes to. Use one key to keep the records in order, or vary it to spread the load across shards.

<Tabs groupId="language">
<TabItem value="go" label="Go">

```go
// github.com/aws/aws-sdk-go-v2/config and service/kinesis
cfg, err := config.LoadDefaultConfig(context.Background())
if err != nil {
	return err
}
client := kinesis.NewFromConfig(cfg)
err = replay("out.csv", true, true, func(body []byte) error {
	_, err := client.PutRecord(context.Background(), &kinesis.PutRecordInput{
		StreamName:   aws.String("<stream>"),
		PartitionKey: aws.String("<partition-key>"),
		Data:         body,
	})
	return err
})
```

</TabItem>
<TabItem value="java" label="Java">

```java
// software.amazon.awssdk:kinesis
try (KinesisClient kinesis = KinesisClient.create()) {
    Replay.replay("out.csv", true, true, body -> kinesis.putRecord(PutRecordRequest.builder()
            .streamName("<stream>")
            .partitionKey("<partition-key>")
            .data(SdkBytes.fromByteArray(body))
            .build()));
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';

const kinesis = new KinesisClient({});
await replay('out.csv', true, true, async (body) => {
  await kinesis.send(new PutRecordCommand({ StreamName: '<stream>', PartitionKey: '<partition-key>', Data: body }));
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
import boto3

kinesis = boto3.client("kinesis")
replay(
    "out.csv",
    lambda body: kinesis.put_record(StreamName="<stream>", PartitionKey="<partition-key>", Data=body),
    is_base64=True,
    respect_timing=True,
)
```

</TabItem>
</Tabs>

### Amazon Data Firehose {#firehose}

Firehose buffers records and delivers them to their destination by its own buffer size and interval, so the destination sees them later than you sent them.

<Tabs groupId="language">
<TabItem value="go" label="Go">

```go
// github.com/aws/aws-sdk-go-v2/config, service/firehose and service/firehose/types
cfg, err := config.LoadDefaultConfig(context.Background())
if err != nil {
	return err
}
client := firehose.NewFromConfig(cfg)
err = replay("out.csv", true, true, func(body []byte) error {
	_, err := client.PutRecord(context.Background(), &firehose.PutRecordInput{
		DeliveryStreamName: aws.String("<delivery-stream>"),
		Record:             &types.Record{Data: body},
	})
	return err
})
```

</TabItem>
<TabItem value="java" label="Java">

```java
// software.amazon.awssdk:firehose
try (FirehoseClient firehose = FirehoseClient.create()) {
    Replay.replay("out.csv", true, true, body -> firehose.putRecord(PutRecordRequest.builder()
            .deliveryStreamName("<delivery-stream>")
            .record(Record.builder().data(SdkBytes.fromByteArray(body)).build())
            .build()));
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { FirehoseClient, PutRecordCommand } from '@aws-sdk/client-firehose';

const firehose = new FirehoseClient({});
await replay('out.csv', true, true, async (body) => {
  await firehose.send(new PutRecordCommand({ DeliveryStreamName: '<delivery-stream>', Record: { Data: body } }));
});
```

</TabItem>
<TabItem value="python" label="Python">

```python
import boto3

firehose = boto3.client("firehose")
replay(
    "out.csv",
    lambda body: firehose.put_record(DeliveryStreamName="<delivery-stream>", Record={"Data": body}),
    is_base64=True,
    respect_timing=True,
)
```

</TabItem>
</Tabs>

The AWS SDKs read credentials and the region from the usual places: environment variables, the shared credentials file or an IAM role.

## Run it

Point the driver at a disposable broker, start the consumer under test, and run the driver. Without the timing flag it sends as fast as the broker accepts, for maximum throughput; with it, the gaps between messages match the recording. Run several copies at once to multiply the load.

A complete RabbitMQ example app with a driver like this is in the [Speedscale demo repository](https://github.com/speedscale/demo/tree/master/go-rabbitmq).
