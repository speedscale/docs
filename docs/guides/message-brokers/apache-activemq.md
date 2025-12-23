---
title: Replaying Apache ActiveMQ
sidebar_position: 3
---

## Background

Apache ActiveMQ supports multiple protocols including AMQP 1.0, STOMP, MQTT, and OpenWire. Since ActiveMQ supports AMQP 1.0, you can use AMQP client libraries to interact with it, similar to RabbitMQ. However, note that ActiveMQ uses AMQP 1.0 (not AMQP 0.9.1 like RabbitMQ), so you'll need AMQP 1.0-compatible client libraries.

For more information about Apache ActiveMQ, see the [Apache ActiveMQ documentation](https://activemq.apache.org/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Apache ActiveMQ uses AMQP 1.0 protocol, you can extract and replay traffic using AMQP client libraries. For general AMQP concepts and extraction patterns, see the [RabbitMQ guide](./rabbitmq.md), but note that ActiveMQ uses AMQP 1.0 (not AMQP 0.9.1).

## Alternative: Custom Load Driver Approach

Apache ActiveMQ supports AMQP 1.0 protocol, so you can extract and replay traffic using AMQP client libraries. The extraction approach is similar to RabbitMQ, but you'll need AMQP 1.0-compatible clients.

### Extract the data

Grab your snapshot id and run this command to extract message payloads from ActiveMQ AMQP traffic:

```bash
speedctl extract data <snapshot-id> --path .AmqpV10.server.transfer.body --path .ts
```

This will generate a CSV with message data, timestamps, and corresponding RRPair UUIDs.

:::tip

This example assumes the message body is in the standard AMQP 1.0 location. If you need to extract additional metadata like routing keys, exchange names, or headers, see `speedctl extract data --help` for advanced path expressions.

:::

### Create your producer

Create a custom load producer using AMQP 1.0 client libraries. The steps are:

1. Read the CSV from the previous step
2. Create an AMQP 1.0 connection and session
3. Create a sender link
4. Iterate over the CSV
5. For each row, extract the message body and optionally the timestamp
6. If timing mode is enabled, wait between messages to match the original recording timing
7. Send the message to ActiveMQ
8. Close the connection when complete

Example scripts in multiple languages are provided below.

:::note

Python has limited AMQP 1.0 client library support compared to other languages. While examples are provided using the `proton` library (Apache Qpid Proton), the ecosystem is less mature than for Go, Java, or TypeScript.

:::

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="go" label="Go">

```go
package main

import (
	"context"
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"os"
	"time"

	"pack.ag/amqp"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "your_file.csv", "Path to CSV file")
	queueName     = flag.String("queue", "demo-queue", "ActiveMQ queue name")
	amqpURL       = flag.String("url", "amqp://localhost:5672", "ActiveMQ AMQP connection URL")
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

	// Connect to ActiveMQ via AMQP 1.0
	client, err := amqp.Dial(*amqpURL)
	if err != nil {
		return fmt.Errorf("failed to connect to ActiveMQ: %w", err)
	}
	defer client.Close()

	// Create a session
	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}

	// Create a sender
	sender, err := session.NewSender(
		amqp.LinkTargetAddress(*queueName),
	)
	if err != nil {
		return fmt.Errorf("failed to create sender: %w", err)
	}

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
		messageBody := []byte(row[0])

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

		// Create AMQP message
		msg := amqp.NewMessage(messageBody)

		// Send message to ActiveMQ
		ctx := context.Background()
		err = sender.Send(ctx, msg)
		if err != nil {
			return fmt.Errorf("failed to send message to ActiveMQ: %w", err)
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
import org.apache.qpid.jms.JmsConnectionFactory;
import javax.jms.*;
import java.io.*;
import java.time.Duration;
import java.time.Instant;

public class ActiveMQReplay {
    private final String csvFile;
    private final String queueName;
    private final String url;
    private final boolean respectTiming;

    public ActiveMQReplay(String csvFile, String queueName, String url, boolean respectTiming) {
        this.csvFile = csvFile;
        this.queueName = queueName;
        this.url = url;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        // Connect to ActiveMQ via AMQP 1.0
        ConnectionFactory factory = new JmsConnectionFactory(url);

        try (Connection connection = factory.createConnection();
             BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {

            connection.start();
            Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
            Destination destination = session.createQueue(queueName);
            MessageProducer producer = session.createProducer(destination);

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

                // Send message to ActiveMQ
                BytesMessage message = session.createBytesMessage();
                message.writeBytes(messageBody.getBytes());
                producer.send(message);
            }

            producer.close();
            session.close();

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
        String url = System.getProperty("url", "amqp://localhost:5672");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        ActiveMQReplay replay = new ActiveMQReplay(csvFile, queueName, url, respectTiming);
        replay.replay();
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import * as rhea from 'rhea';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface Config {
  csvFile: string;
  queueName: string;
  url: string;
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Parse AMQP URL
  const urlObj = new URL(config.url);

  // Create AMQP 1.0 connection
  const connection = rhea.connect({
    host: urlObj.hostname,
    port: parseInt(urlObj.port || '5672'),
    username: urlObj.username || undefined,
    password: urlObj.password || undefined,
  });

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

  // Wait for connection to be established
  await new Promise<void>((resolve) => {
    connection.once('connection_open', resolve);
  });

  // Create sender
  const sender = connection.open_sender(config.queueName);

  // Wait for sender to be ready
  await new Promise<void>((resolve) => {
    sender.once('sendable', resolve);
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

    // Send message to ActiveMQ
    sender.send({
      body: row.message,
    });
  }

  connection.close();

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
  url: process.env.URL || 'amqp://localhost:5672',
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
from proton import Message
from proton.handlers import MessagingHandler
from proton.reactor import Container

class ActiveMQReplay(MessagingHandler):
    def __init__(self, csv_file, queue_name, url, respect_timing):
        super(ActiveMQReplay, self).__init__()
        self.csv_file = csv_file
        self.queue_name = queue_name
        self.url = url
        self.respect_timing = respect_timing
        self.sender = None
        self.messages = []
        self.last_timestamp = None
        self.start_time = None

    def on_start(self, event):
        # Connect to ActiveMQ via AMQP 1.0
        conn = event.container.connect(self.url)
        self.sender = event.container.create_sender(conn, self.queue_name)

        # Load messages from CSV
        with open(self.csv_file, 'r') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header row

            for row in reader:
                message_body = row[0]
                timestamp = row[1] if len(row) > 1 else None
                self.messages.append((message_body, timestamp))

    def on_sendable(self, event):
        # Send all messages
        self.start_time = time.time()

        for message_body, timestamp_str in self.messages:
            # Handle timing if enabled
            if self.respect_timing and timestamp_str:
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

                if self.last_timestamp is not None:
                    delay = (timestamp - self.last_timestamp).total_seconds()
                    if delay > 0:
                        time.sleep(delay)

                self.last_timestamp = timestamp

            # Send message to ActiveMQ
            msg = Message(body=message_body)
            self.sender.send(msg)

        # Close connection after sending all messages
        self.sender.close()
        event.connection.close()

    def on_connection_closed(self, event):
        if self.respect_timing:
            elapsed = time.time() - self.start_time
            print(f"Replay completed in {elapsed:.2f}s with original timing")
        else:
            print("Replay completed at maximum speed")

def replay(csv_file, queue_name, url, respect_timing):
    handler = ActiveMQReplay(csv_file, queue_name, url, respect_timing)
    Container(handler).run()

if __name__ == "__main__":
    parser = ArgumentParser(description='Replay ActiveMQ messages from CSV')
    parser.add_argument('--csv', default='your_file.csv', help='Path to CSV file')
    parser.add_argument('--queue', default='demo-queue', help='ActiveMQ queue name')
    parser.add_argument('--url', default='amqp://localhost:5672', help='ActiveMQ AMQP connection URL')
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
go run main.go --csv your_file.csv --queue demo-queue --url amqp://localhost:5672
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --queue demo-queue --url amqp://localhost:5672 --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send messages as fast as possible (default):
```bash
javac ActiveMQReplay.java
java -Dcsv=your_file.csv -Dqueue=demo-queue -Durl=amqp://localhost:5672 ActiveMQReplay
```

Respect original message timing from the recording:
```bash
java -Dcsv=your_file.csv -Dqueue=demo-queue -Durl=amqp://localhost:5672 -Drespect-timing=true ActiveMQReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send messages as fast as possible (default):
```bash
CSV=your_file.csv QUEUE=demo-queue URL=amqp://localhost:5672 npx ts-node main.ts
```

Respect original message timing from the recording:
```bash
CSV=your_file.csv QUEUE=demo-queue URL=amqp://localhost:5672 RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send messages as fast as possible (default):
```bash
python main.py --csv your_file.csv --queue demo-queue --url amqp://localhost:5672
```

Respect original message timing from the recording:
```bash
python main.py --csv your_file.csv --queue demo-queue --url amqp://localhost:5672 --respect-timing
```

</TabItem>
</Tabs>

:::note

Make sure to update the connection URL, queue name, and ensure you have proper authentication configured if required. ActiveMQ uses AMQP 1.0 protocol, which differs from RabbitMQ's AMQP 0.9.1. Ensure you use AMQP 1.0-compatible client libraries.

For general AMQP concepts and extraction patterns, see the [RabbitMQ guide](./rabbitmq.md), but remember that ActiveMQ uses AMQP 1.0. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

