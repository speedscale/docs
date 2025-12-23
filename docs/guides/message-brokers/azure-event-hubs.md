---
title: Replaying Azure Event Hubs
sidebar_position: 9
---

## Background

Azure Event Hubs provides a Kafka-compatible API, allowing you to use standard Kafka client libraries to interact with Event Hubs. Since Event Hubs uses Kafka protocol, you can extract and replay traffic using the same approach as Kafka. Event Hubs also provides an HTTP REST API for management operations, but the primary messaging interface is Kafka-compatible.

For more information about Azure Event Hubs, see the [Azure Event Hubs documentation](https://azure.microsoft.com/en-us/products/event-hubs).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Azure Event Hubs uses Kafka-compatible APIs, you can use Speedscale's standard replay capabilities with Kafka client libraries:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with Azure Event Hubs
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality to replay the traffic

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Alternative: Custom Load Driver Approach

Azure Event Hubs uses Kafka-compatible APIs, so you can extract and replay traffic using the same approach as Kafka. For detailed information on extracting Kafka traffic, see the [Kafka guide](./kafka.md).

### Extract the data

Grab your snapshot id and run this command to extract message data and timestamps from Event Hubs Kafka traffic:

```bash
speedctl extract data <snapshot-id> --path kafka.response.FetchResponse.topics.0.partitions.0.records.records.0.valueString --path .ts --filter='(command IS  "Fetch")'
```

This will generate a CSV with message data, timestamps, and corresponding RRPair UUIDs.

### Create your producer

Next up, using the language and LLM of your choice, create a small load producer to send these messages to your Event Hub. The steps here are:

1. Read the CSV from the previous step.
1. Create a Kafka producer/client configured for Event Hubs with SASL authentication.
1. Iterate over the CSV.
1. For each row in the CSV, extract the message body and optionally the timestamp.
1. If timing mode is enabled, wait between messages to match the original recording timing.
1. Send the message to Event Hubs.
1. Wait for the producer flush to complete.

Example scripts in multiple languages are provided below.

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

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "out.csv", "Path to CSV file")
	kafkaTopic    = flag.String("topic", "demo-topic", "Event Hub name")
	brokers       = flag.String("brokers", "your-namespace.servicebus.windows.net:9093", "Event Hubs Kafka endpoint")
	saslUsername  = flag.String("sasl-username", "$ConnectionString", "SASL username")
	saslPassword  = flag.String("sasl-password", "", "Event Hubs connection string")
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

	// Create Kafka producer configured for Event Hubs
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": *brokers,
		"security.protocol": "SASL_SSL",
		"sasl.mechanism":    "PLAIN",
		"sasl.username":     *saslUsername,
		"sasl.password":     *saslPassword,
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
				Topic:     *kafkaTopic,
				Partition: kafka.PartitionAny,
			},
			Value: []byte(messageBody),
		}

		// Produce message to Event Hubs
		if err := producer.Produce(msg, nil); err != nil {
			return fmt.Errorf("failed to produce message to Event Hubs: %w", err)
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
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import java.io.*;
import java.time.Duration;
import java.time.Instant;
import java.util.Properties;

public class EventHubsReplay {
    private final String csvFile;
    private final String topic;
    private final String brokers;
    private final String saslUsername;
    private final String saslPassword;
    private final boolean respectTiming;

    public EventHubsReplay(String csvFile, String topic, String brokers,
                          String saslUsername, String saslPassword, boolean respectTiming) {
        this.csvFile = csvFile;
        this.topic = topic;
        this.brokers = brokers;
        this.saslUsername = saslUsername;
        this.saslPassword = saslPassword;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        // Configure Kafka producer for Event Hubs
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, brokers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put("security.protocol", "SASL_SSL");
        props.put("sasl.mechanism", "PLAIN");
        props.put("sasl.jaas.config", String.format(
            "org.apache.kafka.common.security.plain.PlainLoginModule required username=\"%s\" password=\"%s\";",
            saslUsername, saslPassword));

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

                // Send message to Event Hubs
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
        String topic = System.getProperty("topic", "demo-topic");
        String brokers = System.getProperty("brokers", "your-namespace.servicebus.windows.net:9093");
        String saslUsername = System.getProperty("sasl-username", "$ConnectionString");
        String saslPassword = System.getProperty("sasl-password", "");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        EventHubsReplay replay = new EventHubsReplay(csvFile, topic, brokers, saslUsername, saslPassword, respectTiming);
        replay.replay();
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { Kafka, Producer, SASLOptions } from 'kafkajs';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface Config {
  csvFile: string;
  topic: string;
  brokers: string[];
  saslUsername: string;
  saslPassword: string;
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Create Kafka client configured for Event Hubs
  const sasl: SASLOptions = {
    mechanism: 'plain',
    username: config.saslUsername,
    password: config.saslPassword,
  };

  const kafka = new Kafka({
    clientId: 'speedscale-replay',
    brokers: config.brokers,
    ssl: true,
    sasl: sasl,
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

    // Send message to Event Hubs
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
  topic: process.env.TOPIC || 'demo-topic',
  brokers: (process.env.BROKERS || 'your-namespace.servicebus.windows.net:9093').split(','),
  saslUsername: process.env.SASL_USERNAME || '$ConnectionString',
  saslPassword: process.env.SASL_PASSWORD || '',
  respectTiming: process.env.RESPECT_TIMING === 'true',
};

replay(config).catch(console.error);
```

</TabItem>
<TabItem value="python" label="Python">

```python
import csv
import time
from datetime import datetime
from argparse import ArgumentParser
from confluent_kafka import Producer

def replay(csv_file, topic, brokers, sasl_username, sasl_password, respect_timing):
    # Create Kafka producer configured for Event Hubs
    conf = {
        'bootstrap.servers': brokers,
        'security.protocol': 'SASL_SSL',
        'sasl.mechanism': 'PLAIN',
        'sasl.username': sasl_username,
        'sasl.password': sasl_password,
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

            # Send message to Event Hubs
            producer.produce(topic, value=message_body.encode('utf-8'))

    # Wait for all messages to be delivered
    producer.flush()

    if respect_timing:
        elapsed = time.time() - start_time
        print(f"Replay completed in {elapsed:.2f}s with original timing")
    else:
        print("Replay completed at maximum speed")

if __name__ == "__main__":
    parser = ArgumentParser(description='Replay Event Hubs messages from CSV')
    parser.add_argument('--csv', default='out.csv', help='Path to CSV file')
    parser.add_argument('--topic', default='demo-topic', help='Event Hub name')
    parser.add_argument('--brokers', default='your-namespace.servicebus.windows.net:9093', help='Event Hubs Kafka endpoint')
    parser.add_argument('--sasl-username', default='$ConnectionString', help='SASL username')
    parser.add_argument('--sasl-password', default='', help='Event Hubs connection string')
    parser.add_argument('--respect-timing', action='store_true', help='Respect original message timing')

    args = parser.parse_args()
    replay(args.csv, args.topic, args.brokers, args.sasl_username, args.sasl_password, args.respect_timing)
```

</TabItem>
</Tabs>

### Usage Examples

<Tabs>
<TabItem value="go" label="Go">

Send messages as fast as possible (default):
```bash
go run main.go --csv out.csv --topic demo-topic --brokers your-namespace.servicebus.windows.net:9093 --sasl-password "Endpoint=sb://..."
```

Respect original message timing from the recording:
```bash
go run main.go --csv out.csv --topic demo-topic --brokers your-namespace.servicebus.windows.net:9093 --sasl-password "Endpoint=sb://..." --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send messages as fast as possible (default):
```bash
javac EventHubsReplay.java
java -Dcsv=out.csv -Dtopic=demo-topic -Dbrokers=your-namespace.servicebus.windows.net:9093 -Dsasl-password="Endpoint=sb://..." EventHubsReplay
```

Respect original message timing from the recording:
```bash
java -Dcsv=out.csv -Dtopic=demo-topic -Dbrokers=your-namespace.servicebus.windows.net:9093 -Dsasl-password="Endpoint=sb://..." -Drespect-timing=true EventHubsReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send messages as fast as possible (default):
```bash
CSV=out.csv TOPIC=demo-topic BROKERS=your-namespace.servicebus.windows.net:9093 SASL_PASSWORD="Endpoint=sb://..." npx ts-node main.ts
```

Respect original message timing from the recording:
```bash
CSV=out.csv TOPIC=demo-topic BROKERS=your-namespace.servicebus.windows.net:9093 SASL_PASSWORD="Endpoint=sb://..." RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send messages as fast as possible (default):
```bash
python main.py --csv out.csv --topic demo-topic --brokers your-namespace.servicebus.windows.net:9093 --sasl-password "Endpoint=sb://..."
```

Respect original message timing from the recording:
```bash
python main.py --csv out.csv --topic demo-topic --brokers your-namespace.servicebus.windows.net:9093 --sasl-password "Endpoint=sb://..." --respect-timing
```

</TabItem>
</Tabs>

### Event Hubs Configuration

Azure Event Hubs requires SASL authentication. You'll need:

1. **Event Hubs namespace**: `your-namespace.servicebus.windows.net`
2. **Event Hub name**: The name of your Event Hub (used as Kafka topic name)
3. **Connection string**: Found in Azure Portal under Event Hubs namespace → Shared access policies

The connection string format is:
```
Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=...
```

:::note

Make sure to update the Event Hubs namespace, topic name, and connection string. Event Hubs uses Kafka-compatible APIs, so you can use standard Kafka client libraries. The main difference is the SASL authentication configuration required for Azure.

For more details on extracting and working with Kafka traffic, see the [Kafka guide](./kafka.md). Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

