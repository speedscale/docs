---
title: Replaying Azure Service Bus
description: "Replay Azure Service Bus REST API traffic with Speedscale. Service Bus AMQP 1.0 traffic, which the Azure SDK messaging clients send, is not supported yet."
sidebar_position: 10
---

## Background

Azure Service Bus supports two protocols: AMQP 1.0, which the Azure SDK clients use to send and receive messages, and an HTTPS REST API.

Speedscale does not decode AMQP 1.0 today. Messages that an application sends or receives over AMQP 1.0 cannot be inspected, mocked or replayed as messages. AMQP 1.0 is a different wire protocol from the AMQP 0.9.1 that Speedscale reads for RabbitMQ.

Calls to the Service Bus REST API are ordinary HTTPS. Speedscale captures, mocks and replays them like any other HTTP traffic once TLS is decrypted. See [TLS capture](/guides/tls/). The rest of this page applies to REST API traffic.

For more information about Azure Service Bus, see the [Azure Service Bus documentation](https://azure.microsoft.com/en-us/products/service-bus).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

For applications that call the Service Bus REST API, you can use Speedscale's standard replay capabilities:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with Azure Service Bus
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality to replay the traffic

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Alternative: Custom Load Driver Approach

If you need more control over message replay patterns or want to extract and replay messages independently, you can use a custom load driver approach. The messages must come from captured REST API traffic.

### Extract the data

Extract message payloads from Service Bus HTTP REST API traffic:

```bash
speedctl extract data <snapshot-id> --path .http.request.body --path .ts
```

### Create your producer

Create a custom load producer using the Azure Service Bus SDK. The producer sends directly to Service Bus, so it does not depend on Speedscale decoding AMQP 1.0. The steps are:

1. Read the CSV from the previous step
2. Create a Service Bus client (Azure SDK)
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Send the message to the Service Bus queue or topic
7. Close the client when complete

Example scripts in multiple languages are provided below.

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

	"github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus"
)

var (
	respectTiming    = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile          = flag.String("csv", "your_file.csv", "Path to CSV file")
	connectionString = flag.String("connection", "", "Azure Service Bus connection string")
	queueName        = flag.String("queue", "demo-queue", "Service Bus queue name")
	topicName        = flag.String("topic", "", "Service Bus topic name (optional, use queue if not set)")
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

	// Create Service Bus client
	client, err := azservicebus.NewClientFromConnectionString(*connectionString, nil)
	if err != nil {
		return fmt.Errorf("failed to create Service Bus client: %w", err)
	}
	defer client.Close(nil)

	var sender *azservicebus.Sender
	if *topicName != "" {
		sender, err = client.NewSender(*topicName, nil)
	} else {
		sender, err = client.NewSender(*queueName, nil)
	}
	if err != nil {
		return fmt.Errorf("failed to create sender: %w", err)
	}
	defer sender.Close(nil)

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

		// Create message
		message := &azservicebus.Message{
			Body: messageBody,
		}

		// Send message to Service Bus
		err = sender.SendMessage(context.Background(), message, nil)
		if err != nil {
			return fmt.Errorf("failed to send message to Service Bus: %w", err)
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
import com.azure.messaging.servicebus.*;
import java.io.*;
import java.time.Duration;
import java.time.Instant;

public class ServiceBusReplay {
    private final String csvFile;
    private final String queueName;
    private final String topicName;
    private final String connectionString;
    private final boolean respectTiming;

    public ServiceBusReplay(String csvFile, String queueName, String topicName, String connectionString, boolean respectTiming) {
        this.csvFile = csvFile;
        this.queueName = queueName;
        this.topicName = topicName;
        this.connectionString = connectionString;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        // Create Service Bus client
        ServiceBusClientBuilder builder = new ServiceBusClientBuilder()
                .connectionString(connectionString);

        ServiceBusSenderClient sender;
        if (topicName != null && !topicName.isEmpty()) {
            sender = builder.sender().topicName(topicName).buildClient();
        } else {
            sender = builder.sender().queueName(queueName).buildClient();
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {
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

                // Send message to Service Bus
                ServiceBusMessage message = new ServiceBusMessage(messageBody);
                sender.sendMessage(message);
            }

            sender.close();

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
        String topicName = System.getProperty("topic", "");
        String connectionString = System.getProperty("connection", "");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        ServiceBusReplay replay = new ServiceBusReplay(csvFile, queueName, topicName, connectionString, respectTiming);
        replay.replay();
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface Config {
  csvFile: string;
  queueName: string;
  topicName?: string;
  connectionString: string;
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Create Service Bus client
  const client = new ServiceBusClient(config.connectionString);

  const sender: ServiceBusSender = config.topicName
    ? client.createSender(config.topicName)
    : client.createSender(config.queueName);

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

    // Send message to Service Bus
    await sender.sendMessages({ body: row.message });
  }

  await sender.close();
  await client.close();

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
  topicName: process.env.TOPIC || undefined,
  connectionString: process.env.CONNECTION || '',
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
from azure.servicebus import ServiceBusClient, ServiceBusMessage

def replay(csv_file, queue_name, topic_name, connection_string, respect_timing):
    # Create Service Bus client
    client = ServiceBusClient.from_connection_string(connection_string)

    if topic_name:
        sender = client.get_topic_sender(topic_name)
    else:
        sender = client.get_queue_sender(queue_name)

    last_timestamp = None
    start_time = time.time()

    with sender, open(csv_file, 'r') as file:
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

            # Send message to Service Bus
            message = ServiceBusMessage(message_body)
            sender.send_messages(message)

    client.close()

    if respect_timing:
        elapsed = time.time() - start_time
        print(f"Replay completed in {elapsed:.2f}s with original timing")
    else:
        print("Replay completed at maximum speed")

if __name__ == "__main__":
    parser = ArgumentParser(description='Replay Azure Service Bus messages from CSV')
    parser.add_argument('--csv', default='your_file.csv', help='Path to CSV file')
    parser.add_argument('--queue', default='demo-queue', help='Service Bus queue name')
    parser.add_argument('--topic', default='', help='Service Bus topic name (optional)')
    parser.add_argument('--connection', default='', help='Azure Service Bus connection string')
    parser.add_argument('--respect-timing', action='store_true', help='Respect original message timing')

    args = parser.parse_args()
    replay(args.csv, args.queue, args.topic, args.connection, args.respect_timing)
```

</TabItem>
</Tabs>

### Usage Examples

<Tabs>
<TabItem value="go" label="Go">

Send messages to a queue as fast as possible (default):
```bash
go run main.go --csv your_file.csv --connection "Endpoint=sb://..." --queue demo-queue
```

Send messages to a topic with timing:
```bash
go run main.go --csv your_file.csv --connection "Endpoint=sb://..." --topic demo-topic --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send messages to a queue as fast as possible (default):
```bash
javac ServiceBusReplay.java
java -Dcsv=your_file.csv -Dconnection="Endpoint=sb://..." -Dqueue=demo-queue ServiceBusReplay
```

Send messages to a topic with timing:
```bash
java -Dcsv=your_file.csv -Dconnection="Endpoint=sb://..." -Dtopic=demo-topic -Drespect-timing=true ServiceBusReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send messages to a queue as fast as possible (default):
```bash
CSV=your_file.csv CONNECTION="Endpoint=sb://..." QUEUE=demo-queue npx ts-node main.ts
```

Send messages to a topic with timing:
```bash
CSV=your_file.csv CONNECTION="Endpoint=sb://..." TOPIC=demo-topic RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send messages to a queue as fast as possible (default):
```bash
python main.py --csv your_file.csv --connection "Endpoint=sb://..." --queue demo-queue
```

Send messages to a topic with timing:
```bash
python main.py --csv your_file.csv --connection "Endpoint=sb://..." --topic demo-topic --respect-timing
```

</TabItem>
</Tabs>

:::note

Make sure to update the connection string, queue/topic name, and ensure you have proper Azure credentials configured. Service Bus connection strings can be obtained from the Azure Portal. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

