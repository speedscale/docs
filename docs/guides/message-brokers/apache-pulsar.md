---
title: Replaying Apache Pulsar
sidebar_position: 4
---

## Background

Apache Pulsar supports multiple protocols: Kafka-compatible API (primary), HTTP REST API, and gRPC. Since Pulsar provides a Kafka-compatible API, you can use standard Kafka client libraries to interact with Pulsar, making it compatible with Speedscale's Kafka replay approach. Pulsar also supports HTTP REST and gRPC APIs for management and alternative messaging patterns.

For more information about Apache Pulsar, see the [Apache Pulsar documentation](https://pulsar.apache.org/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Apache Pulsar uses Kafka-compatible APIs, you can use Speedscale's standard replay capabilities with Kafka client libraries:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with Apache Pulsar
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality to replay the traffic

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Alternative: Custom Load Driver Approach

Apache Pulsar supports multiple protocols. The most common approach is using the Kafka-compatible API, which allows you to extract and replay traffic using the same approach as Kafka. For detailed information on extracting Kafka traffic, see the [Kafka guide](./kafka.md).

### Method 1: Using Kafka-Compatible API

Pulsar's Kafka-compatible API allows you to use standard Kafka client libraries. Extract message data and timestamps from Pulsar Kafka traffic:

```bash
speedctl extract data <snapshot-id> --path kafka.response.FetchResponse.topics.0.partitions.0.records.records.0.valueString --path .ts --filter='(command IS  "Fetch")'
```

### Method 2: Using HTTP REST API

If you're using Pulsar's HTTP REST API, extract message payloads:

```bash
speedctl extract data <snapshot-id> --path .http.request.body --path .ts
```

### Method 3: Using gRPC API

If you're using Pulsar's gRPC API, you can extract data from gRPC messages. See Speedscale's [gRPC documentation](/observe/bodies.md#grpc) for details on extracting gRPC traffic.

### Create your producer

Create a custom load producer using Kafka client libraries (for Kafka-compatible API), HTTP client (for REST API), or gRPC client (for gRPC API). The steps are:

1. Read the CSV from the previous step
2. Create a Kafka producer, HTTP client, or gRPC client configured for Pulsar
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Send the message to Pulsar
7. Wait for delivery confirmation

Example scripts in multiple languages using Pulsar's Kafka-compatible API are provided below.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="go" label="Go">

```go
package main

import (
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"os"
	"time"

	// Using Kafka client library for Pulsar's Kafka-compatible API
	"github.com/confluentinc/confluent-kafka-go/kafka"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "out.csv", "Path to CSV file")
	topic         = flag.String("topic", "persistent://public/default/demo-topic", "Pulsar topic name")
	brokers       = flag.String("brokers", "localhost:6650", "Pulsar broker addresses")
)

func main() {
	flag.Parse()
	if err := do(); err != nil {
		panic(err)
	}
}

func do() error {
	// Open CSV file
	file, err := os.Open(*csvFile)
	if err != nil {
		return fmt.Errorf("failed to open CSV file: %w", err)
	}
	defer file.Close()

	// Create CSV reader
	reader := csv.NewReader(file)

	// Skip header row
	if _, err := reader.Read(); err != nil {
		return fmt.Errorf("failed to read CSV header: %w", err)
	}

	// Create Kafka producer configured for Pulsar's Kafka-compatible API
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": *brokers,
	})
	if err != nil {
		return fmt.Errorf("failed to create Kafka producer: %w", err)
	}
	defer producer.Close()

	var lastTimestamp time.Time
	startTime := time.Now()

	// Iterate over CSV rows
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read CSV row: %w", err)
		}

		// Extract message body from first column
		messageBody := row[0]

		// Handle timing if enabled
		if *respectTiming && len(row) > 1 {
			// Parse timestamp from second column
			timestamp, err := time.Parse(time.RFC3339Nano, row[1])
			if err != nil {
				return fmt.Errorf("failed to parse timestamp %s: %w", row[1], err)
			}

			// Calculate delay relative to previous message
			if !lastTimestamp.IsZero() {
				delay := timestamp.Sub(lastTimestamp)
				if delay > 0 {
					time.Sleep(delay)
				}
			} else {
				// First message - record start time
				startTime = time.Now()
			}
			lastTimestamp = timestamp
		}

		// Create Kafka message
		msg := &kafka.Message{
			TopicPartition: kafka.TopicPartition{
				Topic:     *topic,
				Partition: kafka.PartitionAny,
			},
			Value: []byte(messageBody),
		}

		// Produce message to Pulsar via Kafka-compatible API
		if err := producer.Produce(msg, nil); err != nil {
			return fmt.Errorf("failed to produce message to Pulsar: %w", err)
		}
	}

	// Wait for all messages to be delivered
	producer.Flush(15000) // 15 second timeout

	if *respectTiming {
		elapsed := time.Since(startTime)
		fmt.Printf("Replay completed in %s with original timing\n", elapsed)
	} else {
		fmt.Println("Replay completed at maximum speed")
	}

	return nil
}
```

</TabItem>
<TabItem value="java" label="Java">

```java
// Using Kafka client library for Pulsar's Kafka-compatible API
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import java.io.*;
import java.time.Duration;
import java.time.Instant;
import java.util.Properties;

public class PulsarReplay {
    private final String csvFile;
    private final String topic;
    private final String brokers;
    private final boolean respectTiming;

    public PulsarReplay(String csvFile, String topic, String brokers, boolean respectTiming) {
        this.csvFile = csvFile;
        this.topic = topic;
        this.brokers = brokers;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        // Configure Kafka producer for Pulsar's Kafka-compatible API
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, brokers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

        try (KafkaProducer<String, String> producer = new KafkaProducer<>(props);
             BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {

            // Skip header row
            reader.readLine();

            Instant lastTimestamp = null;
            Instant startTime = Instant.now();

            String line;
            while ((line = reader.readLine()) != null) {
                String[] columns = line.split(",", -1);
                String messageBody = columns[0].replaceAll("^\"|\"$", ""); // Remove quotes

                // Handle timing if enabled
                if (respectTiming && columns.length > 1) {
                    Instant timestamp = Instant.parse(columns[1]);

                    if (lastTimestamp != null) {
                        Duration delay = Duration.between(lastTimestamp, timestamp);
                        if (!delay.isNegative()) {
                            Thread.sleep(delay.toMillis());
                        }
                    } else {
                        startTime = Instant.now();
                    }
                    lastTimestamp = timestamp;
                }

                // Send message to Pulsar via Kafka-compatible API
                ProducerRecord<String, String> record = new ProducerRecord<>(topic, messageBody);
                producer.send(record);
            }

            // Wait for all messages to be delivered
            producer.flush();

            if (respectTiming) {
                Duration elapsed = Duration.between(startTime, Instant.now());
                System.out.println("Replay completed in " + elapsed + " with original timing");
            } else {
                System.out.println("Replay completed at maximum speed");
            }
        }
    }

    public static void main(String[] args) throws Exception {
        String csvFile = System.getProperty("csv", "out.csv");
        String topic = System.getProperty("topic", "persistent://public/default/demo-topic");
        String brokers = System.getProperty("brokers", "localhost:6650");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        PulsarReplay replay = new PulsarReplay(csvFile, topic, brokers, respectTiming);
        replay.replay();
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
// Using Kafka client library for Pulsar's Kafka-compatible API
import { Kafka, Producer } from 'kafkajs';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface Config {
  csvFile: string;
  topic: string;
  brokers: string[];
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Create Kafka client configured for Pulsar's Kafka-compatible API
  const kafka = new Kafka({
    clientId: 'speedscale-pulsar-replay',
    brokers: config.brokers,
  });

  const producer: Producer = kafka.producer();
  await producer.connect();

  let lastTimestamp: Date | null = null;
  const startTime = new Date();
  const rows: Array<{ message: string; timestamp?: string }> = [];

  // Read CSV file
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(config.csvFile)
      .pipe(csv())
      .on('data', (row) => {
        rows.push({
          message: Object.values(row)[0] as string,
          timestamp: Object.values(row)[1] as string | undefined,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Process rows
  for (const row of rows) {
    // Handle timing if enabled
    if (config.respectTiming && row.timestamp) {
      const timestamp = new Date(row.timestamp);

      if (lastTimestamp) {
        const delay = timestamp.getTime() - lastTimestamp.getTime();
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      lastTimestamp = timestamp;
    }

    // Send message to Pulsar via Kafka-compatible API
    await producer.send({
      topic: config.topic,
      messages: [{ value: row.message }],
    });
  }

  await producer.disconnect();

  if (config.respectTiming) {
    const elapsed = new Date().getTime() - startTime.getTime();
    console.log(`Replay completed in ${elapsed}ms with original timing`);
  } else {
    console.log('Replay completed at maximum speed');
  }
}

// Parse command line arguments
const config: Config = {
  csvFile: process.env.CSV || 'out.csv',
  topic: process.env.TOPIC || 'persistent://public/default/demo-topic',
  brokers: (process.env.BROKERS || 'localhost:6650').split(','),
  respectTiming: process.env.RESPECT_TIMING === 'true',
};

replay(config).catch(console.error);
```

</TabItem>
<TabItem value="python" label="Python">

```python
# Using Kafka client library for Pulsar's Kafka-compatible API
import csv
import time
from datetime import datetime
from argparse import ArgumentParser
from confluent_kafka import Producer

def replay(csv_file, topic, brokers, respect_timing):
    # Create Kafka producer configured for Pulsar's Kafka-compatible API
    conf = {
        'bootstrap.servers': brokers,
    }
    producer = Producer(conf)

    last_timestamp = None
    start_time = time.time()

    with open(csv_file, 'r') as file:
        reader = csv.reader(file)
        next(reader)  # Skip header row

        for row in reader:
            message_body = row[0]

            # Handle timing if enabled
            if respect_timing and len(row) > 1:
                timestamp = datetime.fromisoformat(row[1].replace('Z', '+00:00'))

                if last_timestamp is not None:
                    delay = (timestamp - last_timestamp).total_seconds()
                    if delay > 0:
                        time.sleep(delay)
                else:
                    start_time = time.time()

                last_timestamp = timestamp

            # Send message to Pulsar via Kafka-compatible API
            producer.produce(topic, value=message_body.encode('utf-8'))

    # Wait for all messages to be delivered
    producer.flush()

    if respect_timing:
        elapsed = time.time() - start_time
        print(f"Replay completed in {elapsed:.2f}s with original timing")
    else:
        print("Replay completed at maximum speed")

if __name__ == "__main__":
    parser = ArgumentParser(description='Replay Pulsar messages from CSV')
    parser.add_argument('--csv', default='out.csv', help='Path to CSV file')
    parser.add_argument('--topic', default='persistent://public/default/demo-topic', help='Pulsar topic name')
    parser.add_argument('--brokers', default='localhost:6650', help='Pulsar broker addresses')
    parser.add_argument('--respect-timing', action='store_true', help='Respect original message timing')

    args = parser.parse_args()
    replay(args.csv, args.topic, args.brokers, args.respect_timing)
```

</TabItem>
</Tabs>

### Usage Examples

<Tabs>
<TabItem value="go" label="Go">

Send messages as fast as possible (default):
```bash
go run main.go --csv out.csv --topic persistent://public/default/demo-topic --brokers localhost:6650
```

Respect original message timing from the recording:
```bash
go run main.go --csv out.csv --topic persistent://public/default/demo-topic --brokers localhost:6650 --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send messages as fast as possible (default):
```bash
javac PulsarReplay.java
java -Dcsv=out.csv -Dtopic=persistent://public/default/demo-topic -Dbrokers=localhost:6650 PulsarReplay
```

Respect original message timing from the recording:
```bash
java -Dcsv=out.csv -Dtopic=persistent://public/default/demo-topic -Dbrokers=localhost:6650 -Drespect-timing=true PulsarReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send messages as fast as possible (default):
```bash
CSV=out.csv TOPIC=persistent://public/default/demo-topic BROKERS=localhost:6650 npx ts-node main.ts
```

Respect original message timing from the recording:
```bash
CSV=out.csv TOPIC=persistent://public/default/demo-topic BROKERS=localhost:6650 RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send messages as fast as possible (default):
```bash
python main.py --csv out.csv --topic persistent://public/default/demo-topic --brokers localhost:6650
```

Respect original message timing from the recording:
```bash
python main.py --csv out.csv --topic persistent://public/default/demo-topic --brokers localhost:6650 --respect-timing
```

</TabItem>
</Tabs>

### Pulsar Configuration

Pulsar topics use a hierarchical naming scheme: `persistent://tenant/namespace/topic-name` or `non-persistent://tenant/namespace/topic-name`. When using the Kafka-compatible API, you can use these full topic names directly.

For authentication, Pulsar supports multiple methods:
- TLS authentication
- OAuth2
- Basic authentication
- JWT tokens

Configure these in your Kafka client's configuration map as needed.

:::note

Make sure to update the topic name (using Pulsar's hierarchical naming), broker addresses, and authentication settings. Pulsar's Kafka-compatible API allows you to use standard Kafka client libraries, making it easy to integrate with existing Kafka-based applications.

For more details on extracting and working with Kafka traffic, see the [Kafka guide](./kafka.md). For HTTP REST API usage, see the [Getting Started Guide](/quick-start.md). Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

