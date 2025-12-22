---
title: Replaying Google Pub/Sub
sidebar_position: 11
---

## Background

Google Pub/Sub uses HTTP-based APIs, which means you can use Speedscale's standard replay capabilities to capture and replay Pub/Sub traffic. Unlike protocol-specific brokers like Kafka or RabbitMQ, Pub/Sub traffic can be replayed directly using Speedscale's standard HTTP replay functionality.

For more information about Google Pub/Sub, see the [Google Cloud Pub/Sub documentation](https://cloud.google.com/pubsub).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Google Pub/Sub uses HTTP-based APIs, you can use Speedscale's standard replay capabilities:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with Google Pub/Sub
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality to replay the traffic

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Alternative: Custom Load Driver Approach

If you need more control over message replay patterns or want to extract and replay messages independently, you can use a custom load driver approach similar to Kafka and RabbitMQ:

### Extract the data

Grab your snapshot id and run this command to extract message payloads from Pub/Sub traffic:

```bash
speedctl extract data <snapshot-id> --path .http.request.body --path .ts
```

This will generate a CSV with message data, timestamps, and corresponding RRPair UUIDs.

### Create your producer

Create a custom load producer using the Google Cloud Pub/Sub client library for your preferred language. The steps are:

1. Read the CSV from the previous step
2. Create a Google Pub/Sub publisher client
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Publish the message to the Pub/Sub topic
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

	"cloud.google.com/go/pubsub"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "your_file.csv", "Path to CSV file")
	topicID       = flag.String("topic", "demo-topic", "Pub/Sub topic ID")
	projectID     = flag.String("project", "your-project-id", "GCP project ID")
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

	// Create Pub/Sub client
	ctx := context.Background()
	client, err := pubsub.NewClient(ctx, *projectID)
	if err != nil {
		return fmt.Errorf("failed to create Pub/Sub client: %w", err)
	}
	defer client.Close()

	topic := client.Topic(*topicID)

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

		// Publish message to Pub/Sub
		result := topic.Publish(ctx, &pubsub.Message{
			Data: messageBody,
		})

		// Wait for publish to complete
		_, err = result.Get(ctx)
		if err != nil {
			return fmt.Errorf("failed to publish message to Pub/Sub: %w", err)
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
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;
import java.io.*;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ExecutionException;

public class PubSubReplay {
    private final String csvFile;
    private final String topicId;
    private final String projectId;
    private final boolean respectTiming;

    public PubSubReplay(String csvFile, String topicId, String projectId, boolean respectTiming) {
        this.csvFile = csvFile;
        this.topicId = topicId;
        this.projectId = projectId;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        TopicName topicName = TopicName.of(projectId, topicId);
        Publisher publisher = null;

        try {
            publisher = Publisher.newBuilder(topicName).build();

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

                    // Publish message to Pub/Sub
                    ByteString data = ByteString.copyFromUtf8(messageBody);
                    PubsubMessage pubsubMessage = PubsubMessage.newBuilder()
                            .setData(data)
                            .build();

                    // Wait for publish to complete
                    publisher.publish(pubsubMessage).get();
                }

                if (respectTiming) {
                    Duration elapsed = Duration.between(startTime, Instant.now());
                    System.out.println("Replay completed in " + elapsed + " with original timing");
                } else {
                    System.out.println("Replay completed at maximum speed");
                }
            }
        } finally {
            if (publisher != null) {
                publisher.shutdown();
            }
        }
    }

    public static void main(String[] args) throws Exception {
        String csvFile = System.getProperty("csv", "your_file.csv");
        String topicId = System.getProperty("topic", "demo-topic");
        String projectId = System.getProperty("project", "your-project-id");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        PubSubReplay replay = new PubSubReplay(csvFile, topicId, projectId, respectTiming);
        replay.replay();
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { PubSub } from '@google-cloud/pubsub';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface Config {
  csvFile: string;
  topicId: string;
  projectId: string;
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Create Pub/Sub client
  const pubsub = new PubSub({ projectId: config.projectId });
  const topic = pubsub.topic(config.topicId);

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

    // Publish message to Pub/Sub
    const dataBuffer = Buffer.from(row.message);
    await topic.publishMessage({ data: dataBuffer });
  }

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
  topicId: process.env.TOPIC || 'demo-topic',
  projectId: process.env.PROJECT || 'your-project-id',
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
from google.cloud import pubsub_v1

def replay(csv_file, topic_id, project_id, respect_timing):
    # Create Pub/Sub client
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

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

            # Publish message to Pub/Sub
            data = message_body.encode('utf-8')
            future = publisher.publish(topic_path, data)
            # Wait for publish to complete
            future.result()

    if respect_timing:
        elapsed = time.time() - start_time
        print(f"Replay completed in {elapsed:.2f}s with original timing")
    else:
        print("Replay completed at maximum speed")

if __name__ == "__main__":
    parser = ArgumentParser(description='Replay Google Pub/Sub messages from CSV')
    parser.add_argument('--csv', default='your_file.csv', help='Path to CSV file')
    parser.add_argument('--topic', default='demo-topic', help='Pub/Sub topic ID')
    parser.add_argument('--project', default='your-project-id', help='GCP project ID')
    parser.add_argument('--respect-timing', action='store_true', help='Respect original message timing')

    args = parser.parse_args()
    replay(args.csv, args.topic, args.project, args.respect_timing)
```

</TabItem>
</Tabs>

### Usage Examples

<Tabs>
<TabItem value="go" label="Go">

Send messages as fast as possible (default):
```bash
go run main.go --csv your_file.csv --topic demo-topic --project your-project-id
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --topic demo-topic --project your-project-id --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send messages as fast as possible (default):
```bash
javac PubSubReplay.java
java -Dcsv=your_file.csv -Dtopic=demo-topic -Dproject=your-project-id PubSubReplay
```

Respect original message timing from the recording:
```bash
java -Dcsv=your_file.csv -Dtopic=demo-topic -Dproject=your-project-id -Drespect-timing=true PubSubReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send messages as fast as possible (default):
```bash
CSV=your_file.csv TOPIC=demo-topic PROJECT=your-project-id npx ts-node main.ts
```

Respect original message timing from the recording:
```bash
CSV=your_file.csv TOPIC=demo-topic PROJECT=your-project-id RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send messages as fast as possible (default):
```bash
python main.py --csv your_file.csv --topic demo-topic --project your-project-id
```

Respect original message timing from the recording:
```bash
python main.py --csv your_file.csv --topic demo-topic --project your-project-id --respect-timing
```

</TabItem>
</Tabs>

:::note

Make sure to update the project ID, topic name, and ensure you have proper GCP authentication configured. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

