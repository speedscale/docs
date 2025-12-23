---
title: Replaying Amazon MQ
sidebar_position: 2
---

## Background

Amazon MQ is a managed message broker service that provides fully managed ActiveMQ or RabbitMQ brokers. Since Amazon MQ offers both ActiveMQ and RabbitMQ, you can use the same approaches as those brokers:

- **ActiveMQ**: Uses AMQP 1.0 protocol (see [Apache ActiveMQ guide](./apache-activemq.md))
- **RabbitMQ**: Uses AMQP 0.9.1 protocol (see [RabbitMQ guide](./rabbitmq.md))

Amazon MQ brokers are accessible via standard AMQP protocols, making them compatible with Speedscale's message broker replay capabilities.

For more information about Amazon MQ, see the [Amazon MQ documentation](https://aws.amazon.com/amazon-mq/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Amazon MQ provides managed ActiveMQ or RabbitMQ brokers, you can use the same replay approaches as those brokers:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with Amazon MQ
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality or custom load drivers

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Broker-Specific Guides

Choose the appropriate guide based on your Amazon MQ broker type:

- **For ActiveMQ brokers**: See the [Apache ActiveMQ guide](./apache-activemq.md) - uses AMQP 1.0 protocol
- **For RabbitMQ brokers**: See the [RabbitMQ guide](./rabbitmq.md) - uses AMQP 0.9.1 protocol

## Amazon MQ Configuration

Amazon MQ brokers are accessible via standard AMQP endpoints. You'll need:

1. **Broker endpoint**: Found in AWS Console under Amazon MQ → Brokers → Your broker → Details
2. **Username and password**: Set when creating the broker or via AWS Secrets Manager
3. **Broker type**: ActiveMQ or RabbitMQ (determines which protocol to use)

### Connection URLs

- **ActiveMQ**: `amqps://broker-id.mq.us-east-1.amazonaws.com:5671`
- **RabbitMQ**: `amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671`

Note: Amazon MQ uses TLS (amqps://) by default. Ensure your client libraries support TLS.

## Alternative: Custom Load Driver Approach

### For ActiveMQ Brokers

Extract message payloads from ActiveMQ AMQP 1.0 traffic:

```bash
speedctl extract data <snapshot-id> --path .AmqpV10.server.transfer.body --path .ts
```

Then follow the steps in the [Apache ActiveMQ guide](./apache-activemq.md) for creating your producer, using the Amazon MQ broker endpoint.

### For RabbitMQ Brokers

Extract message payloads from RabbitMQ AMQP 0.9.1 traffic:

```bash
speedctl extract data <snapshot-id> --path .AmqpV091.server.basic.deliver.body --path .ts
```

Then follow the steps in the [RabbitMQ guide](./rabbitmq.md) for creating your producer, using the Amazon MQ broker endpoint.

### Example: RabbitMQ on Amazon MQ

Example scripts in multiple languages for RabbitMQ brokers on Amazon MQ:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="go" label="Go">

```go
package main

import (
	"encoding/base64"
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "your_file.csv", "Path to CSV file")
	queueName     = flag.String("queue", "demo-queue", "Queue name")
	amqpURL       = flag.String("url", "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671", "Amazon MQ connection URL")
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

	// Connect to Amazon MQ
	conn, err := amqp.Dial(*amqpURL)
	if err != nil {
		return fmt.Errorf("failed to connect to Amazon MQ: %w", err)
	}
	defer conn.Close()

	// Create a channel
	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open channel: %w", err)
	}
	defer ch.Close()

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
		bodyString, err := base64.StdEncoding.DecodeString(messageBody)
		if err != nil {
			return fmt.Errorf("failed to decode message body: %w", err)
		}

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

		// Publish message to Amazon MQ
		err = ch.Publish(
			"",         // exchange
			*queueName, // routing key (queue name)
			false,      // mandatory
			false,      // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        bodyString,
			},
		)
		if err != nil {
			return fmt.Errorf("failed to publish message to Amazon MQ: %w", err)
		}
	}

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
import com.rabbitmq.client.*;
import java.io.*;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

public class AmazonMQReplay {
    private final String csvFile;
    private final String queueName;
    private final String url;
    private final boolean respectTiming;

    public AmazonMQReplay(String csvFile, String queueName, String url, boolean respectTiming) {
        this.csvFile = csvFile;
        this.queueName = queueName;
        this.url = url;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        // Connect to Amazon MQ
        ConnectionFactory factory = new ConnectionFactory();
        factory.setUri(url);

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel();
             BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {

            // Skip header row
            reader.readLine();

            Instant lastTimestamp = null;
            Instant startTime = Instant.now();

            String line;
            while ((line = reader.readLine()) != null) {
                String[] columns = line.split(",", -1);
                String messageBody = columns[0].replaceAll("^\"|\"$", ""); // Remove quotes
                byte[] bodyBytes = Base64.getDecoder().decode(messageBody);

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

                // Publish message to Amazon MQ
                AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
                        .contentType("text/plain")
                        .build();

                channel.basicPublish("", queueName, props, bodyBytes);
            }

            if (respectTiming) {
                Duration elapsed = Duration.between(startTime, Instant.now());
                System.out.println("Replay completed in " + elapsed + " with original timing");
            } else {
                System.out.println("Replay completed at maximum speed");
            }
        }
    }

    public static void main(String[] args) throws Exception {
        String csvFile = System.getProperty("csv", "your_file.csv");
        String queueName = System.getProperty("queue", "demo-queue");
        String url = System.getProperty("url", "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        AmazonMQReplay replay = new AmazonMQReplay(csvFile, queueName, url, respectTiming);
        replay.replay();
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import * as amqp from 'amqplib';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface Config {
  csvFile: string;
  queueName: string;
  url: string;
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Connect to Amazon MQ
  const connection = await amqp.connect(config.url);
  const channel = await connection.createChannel();

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
    // Decode base64 message body
    const bodyBuffer = Buffer.from(row.message, 'base64');

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

    // Publish message to Amazon MQ
    channel.publish('', config.queueName, bodyBuffer, {
      contentType: 'text/plain',
    });
  }

  await channel.close();
  await connection.close();

  if (config.respectTiming) {
    const elapsed = new Date().getTime() - startTime.getTime();
    console.log(`Replay completed in ${elapsed}ms with original timing`);
  } else {
    console.log('Replay completed at maximum speed');
  }
}

// Parse command line arguments
const config: Config = {
  csvFile: process.env.CSV || 'your_file.csv',
  queueName: process.env.QUEUE || 'demo-queue',
  url: process.env.URL || 'amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671',
  respectTiming: process.env.RESPECT_TIMING === 'true',
};

replay(config).catch(console.error);
```

</TabItem>
<TabItem value="python" label="Python">

```python
import csv
import time
import base64
from datetime import datetime
from argparse import ArgumentParser
import pika

def replay(csv_file, queue_name, url, respect_timing):
    # Connect to Amazon MQ
    parameters = pika.URLParameters(url)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    last_timestamp = None
    start_time = time.time()

    with open(csv_file, 'r') as file:
        reader = csv.reader(file)
        next(reader)  # Skip header row

        for row in reader:
            message_body = row[0]
            body_bytes = base64.b64decode(message_body)

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

            # Publish message to Amazon MQ
            channel.basic_publish(
                exchange='',
                routing_key=queue_name,
                body=body_bytes,
                properties=pika.BasicProperties(content_type='text/plain')
            )

    connection.close()

    if respect_timing:
        elapsed = time.time() - start_time
        print(f"Replay completed in {elapsed:.2f}s with original timing")
    else:
        print("Replay completed at maximum speed")

if __name__ == "__main__":
    parser = ArgumentParser(description='Replay Amazon MQ RabbitMQ messages from CSV')
    parser.add_argument('--csv', default='your_file.csv', help='Path to CSV file')
    parser.add_argument('--queue', default='demo-queue', help='Queue name')
    parser.add_argument('--url', default='amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671', help='Amazon MQ connection URL')
    parser.add_argument('--respect-timing', action='store_true', help='Respect original message timing')

    args = parser.parse_args()
    replay(args.csv, args.queue, args.url, args.respect_timing)
```

</TabItem>
</Tabs>

### Usage Examples

<Tabs>
<TabItem value="go" label="Go">

Send messages as fast as possible (default):
```bash
go run main.go --csv your_file.csv --queue demo-queue --url "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671"
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --queue demo-queue --url "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671" --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send messages as fast as possible (default):
```bash
javac AmazonMQReplay.java
java -Dcsv=your_file.csv -Dqueue=demo-queue -Durl="amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671" AmazonMQReplay
```

Respect original message timing from the recording:
```bash
java -Dcsv=your_file.csv -Dqueue=demo-queue -Durl="amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671" -Drespect-timing=true AmazonMQReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send messages as fast as possible (default):
```bash
CSV=your_file.csv QUEUE=demo-queue URL="amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671" npx ts-node main.ts
```

Respect original message timing from the recording:
```bash
CSV=your_file.csv QUEUE=demo-queue URL="amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671" RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send messages as fast as possible (default):
```bash
python main.py --csv your_file.csv --queue demo-queue --url "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671"
```

Respect original message timing from the recording:
```bash
python main.py --csv your_file.csv --queue demo-queue --url "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671" --respect-timing
```

</TabItem>
</Tabs>

:::note

Make sure to update the connection URL with your Amazon MQ broker endpoint, queue name, and credentials. Amazon MQ uses TLS by default, so ensure your client libraries support TLS/SSL connections.

- For **ActiveMQ brokers**, use AMQP 1.0 client libraries and follow the [Apache ActiveMQ guide](./apache-activemq.md)
- For **RabbitMQ brokers**, use AMQP 0.9.1 client libraries and follow the [RabbitMQ guide](./rabbitmq.md)

Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

