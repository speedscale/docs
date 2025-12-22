---
title: Replaying RabbitMQ
sidebar_position: 13
---

## Background

In this guide we will show you how to replay RabbitMQ traffic using data captured by Speedscale. The network level modelling of AMQP does not match most people's mental model which leads to confusion and an undesirable replay scenario. Most people view their app interacting with RabbitMQ like this.

For more information about RabbitMQ, see the [official RabbitMQ documentation](https://www.rabbitmq.com/).

```mermaid
sequenceDiagram
    RabbitMQ->>App: Message Delivered
    App-->>RabbitMQ: Ack
```

when the reality looks more like this

```mermaid
sequenceDiagram
    App->>RabbitMQ: Open Connection
    RabbitMQ-->>App: Connection OK
    App->>RabbitMQ: Open Channel
    RabbitMQ-->>App: Channel OK
    App->>RabbitMQ: Subscribe to Queue (Basic.Consume)
    RabbitMQ-->>App: Consume OK
    RabbitMQ->>App: Basic.Deliver (Message)
    App-->>RabbitMQ: Basic.Ack
```

This is why when observed in Speedscale, you see something like this that has a lot of internal AMQP protocol calls along with the most important `Basic.Deliver` messages.

This sort of inbound traffic would typically be played back during a replay. In the case of RabbitMQ however, we can simplify the replay process by extracting `Basic.Deliver` messages and converting them into `Basic.Publish` calls controlled by our homemade load driver.

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
1. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Extract the data

Grab your snapshot id and run this command. This will extract the message body and timestamps from RabbitMQ Basic.Deliver frames which are deeply nested in Speedscale's RRPair format.

```bash
speedctl extract data <snapshot-id> --path .AmqpV091.server.basic.deliver.body --path .ts
```

This will generate a csv that looks something like this, with the message data, timestamp, and the corresponding RRPair UUID (not needed in this case)

```csv
.AmqpV091.server.basic.deliver.body,.ts,RRPair UUID
"message1",2024-01-15T10:30:45.123Z,44f7a2cc-2045-4fb6-9635-3da8aa7fa909
"message2",2024-01-15T10:30:46.456Z,58f7a2cc-1135-4fa6-3433-ada5aa2fa161
```

:::tip

This example assumes the message body is in the standard location. If you need to extract additional metadata like routing keys, exchange names, or headers, see `speedctl extract data --help` for advanced path expressions.

:::

## Create your producer

Next up, using the language and LLM of your choice, create a small load producer to send these messages to your RabbitMQ broker. The steps here are

1. Read the CSV from our previous step.
1. Create a RabbitMQ connection and channel.
1. Iterate over the CSV.
1. For each row in the CSV, extract the message body and optionally the timestamp.
1. If timing mode is enabled, wait between messages to match the original recording timing.
1. Decode the base64 message body and publish it to RabbitMQ.
1. Close the connection when complete.

Example scripts in multiple languages are provided below. You can also find a complete demo app with this generator in our demo [repository](https://github.com/speedscale/demo/tree/master/go-rabbitmq).

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
	queueName     = flag.String("queue", "demo-queue", "RabbitMQ queue name")
	exchange      = flag.String("exchange", "", "RabbitMQ exchange name (empty for default)")
	amqpURL       = flag.String("url", "amqp://guest:guest@localhost:5672/", "RabbitMQ connection URL")
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

	// Connect to RabbitMQ
	conn, err := amqp.Dial(*amqpURL)
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
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

		// Publish message to RabbitMQ
		err = ch.Publish(
			*exchange,  // exchange
			*queueName, // routing key (queue name)
			false,      // mandatory
			false,      // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        bodyString,
			},
		)
		if err != nil {
			return fmt.Errorf("failed to publish message to RabbitMQ: %w", err)
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

public class RabbitMQReplay {
    private final String csvFile;
    private final String queueName;
    private final String exchange;
    private final String url;
    private final boolean respectTiming;

    public RabbitMQReplay(String csvFile, String queueName, String exchange, String url, boolean respectTiming) {
        this.csvFile = csvFile;
        this.queueName = queueName;
        this.exchange = exchange;
        this.url = url;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        // Connect to RabbitMQ
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

                // Publish message to RabbitMQ
                AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
                        .contentType("text/plain")
                        .build();

                channel.basicPublish(exchange, queueName, props, bodyBytes);
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
        String exchange = System.getProperty("exchange", "");
        String url = System.getProperty("url", "amqp://guest:guest@localhost:5672/");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        RabbitMQReplay replay = new RabbitMQReplay(csvFile, queueName, exchange, url, respectTiming);
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
  exchange: string;
  url: string;
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Connect to RabbitMQ
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

    // Publish message to RabbitMQ
    channel.publish(config.exchange, config.queueName, bodyBuffer, {
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
  exchange: process.env.EXCHANGE || '',
  url: process.env.URL || 'amqp://guest:guest@localhost:5672/',
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

def replay(csv_file, queue_name, exchange, url, respect_timing):
    # Connect to RabbitMQ
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

            # Publish message to RabbitMQ
            channel.basic_publish(
                exchange=exchange,
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
    parser = ArgumentParser(description='Replay RabbitMQ messages from CSV')
    parser.add_argument('--csv', default='your_file.csv', help='Path to CSV file')
    parser.add_argument('--queue', default='demo-queue', help='RabbitMQ queue name')
    parser.add_argument('--exchange', default='', help='RabbitMQ exchange name')
    parser.add_argument('--url', default='amqp://guest:guest@localhost:5672/', help='RabbitMQ connection URL')
    parser.add_argument('--respect-timing', action='store_true', help='Respect original message timing')

    args = parser.parse_args()
    replay(args.csv, args.queue, args.exchange, args.url, args.respect_timing)
```

</TabItem>
</Tabs>

### Usage Examples

<Tabs>
<TabItem value="go" label="Go">

Send messages as fast as possible (default):
```bash
go run main.go --csv your_file.csv --queue demo-queue --url amqp://guest:guest@localhost:5672/
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --queue demo-queue --url amqp://guest:guest@localhost:5672/ --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send messages as fast as possible (default):
```bash
javac RabbitMQReplay.java
java -Dcsv=your_file.csv -Dqueue=demo-queue -Durl=amqp://guest:guest@localhost:5672/ RabbitMQReplay
```

Respect original message timing from the recording:
```bash
java -Dcsv=your_file.csv -Dqueue=demo-queue -Durl=amqp://guest:guest@localhost:5672/ -Drespect-timing=true RabbitMQReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send messages as fast as possible (default):
```bash
CSV=your_file.csv QUEUE=demo-queue URL=amqp://guest:guest@localhost:5672/ npx ts-node main.ts
```

Respect original message timing from the recording:
```bash
CSV=your_file.csv QUEUE=demo-queue URL=amqp://guest:guest@localhost:5672/ RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send messages as fast as possible (default):
```bash
python main.py --csv your_file.csv --queue demo-queue --url amqp://guest:guest@localhost:5672/
```

Respect original message timing from the recording:
```bash
python main.py --csv your_file.csv --queue demo-queue --url amqp://guest:guest@localhost:5672/ --respect-timing
```

</TabItem>
</Tabs>

:::note

Make sure to update the connection string, queue name, and exchange settings to match your RabbitMQ configuration. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::
