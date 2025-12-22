---
title: Replaying AWS Kinesis
sidebar_position: 5
---

## Background

AWS Kinesis Data Streams uses HTTP-based APIs, which means you can use Speedscale's standard replay capabilities to capture and replay Kinesis traffic. Kinesis also offers a Kafka-compatible API, allowing you to use Kafka client libraries with Kinesis streams. Both approaches are supported by Speedscale.

For more information about AWS Kinesis Data Streams, see the [AWS Kinesis Data Streams documentation](https://aws.amazon.com/kinesis/data-streams/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since AWS Kinesis uses HTTP-based APIs, you can use Speedscale's standard replay capabilities:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with AWS Kinesis
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality to replay the traffic

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Alternative: Custom Load Driver Approach

If you need more control over message replay patterns or want to extract and replay messages independently, you can use a custom load driver approach. Kinesis supports two methods:

### Method 1: Using Kinesis HTTP API

Extract message payloads from Kinesis HTTP API traffic:

```bash
speedctl extract data <snapshot-id> --path .http.request.body --path .ts
```

### Method 2: Using Kafka-Compatible API

If you're using Kinesis with the Kafka-compatible API, you can extract data similar to Kafka:

```bash
speedctl extract data <snapshot-id> --path kafka.response.FetchResponse.topics.0.partitions.0.records.records.0.valueString --path .ts --filter='(command IS  "Fetch")'
```

For more details on extracting Kafka-compatible traffic, see the [Kafka guide](./kafka.md).

## Create your producer

Create a custom load producer using the AWS SDK for Kinesis or Kafka client libraries. The steps are:

1. Read the CSV from the previous step
2. Create a Kinesis client (AWS SDK) or Kafka producer (for Kafka-compatible API)
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Put the record to the Kinesis stream
7. Close the client when complete

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

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/kinesis"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "your_file.csv", "Path to CSV file")
	streamName    = flag.String("stream", "demo-stream", "Kinesis stream name")
	region        = flag.String("region", "us-east-1", "AWS region")
	partitionKey  = flag.String("partition-key", "default", "Partition key for records")
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

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(*region),
	})
	if err != nil {
		return fmt.Errorf("failed to create AWS session: %w", err)
	}

	// Create Kinesis client
	svc := kinesis.New(sess)

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

		// Put record to Kinesis stream
		_, err = svc.PutRecord(&kinesis.PutRecordInput{
			StreamName:   aws.String(*streamName),
			Data:         messageBody,
			PartitionKey: aws.String(*partitionKey),
		})
		if err != nil {
			return fmt.Errorf("failed to put record to Kinesis: %w", err)
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
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.kinesis.KinesisClient;
import software.amazon.awssdk.services.kinesis.model.PutRecordRequest;
import java.io.*;
import java.time.Duration;
import java.time.Instant;
import java.nio.charset.StandardCharsets;

public class KinesisReplay {
    private final String csvFile;
    private final String streamName;
    private final String region;
    private final String partitionKey;
    private final boolean respectTiming;

    public KinesisReplay(String csvFile, String streamName, String region, String partitionKey, boolean respectTiming) {
        this.csvFile = csvFile;
        this.streamName = streamName;
        this.region = region;
        this.partitionKey = partitionKey;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        // Create Kinesis client
        KinesisClient kinesisClient = KinesisClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();

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

                // Put record to Kinesis stream
                PutRecordRequest request = PutRecordRequest.builder()
                        .streamName(streamName)
                        .partitionKey(partitionKey)
                        .data(SdkBytes.fromString(messageBody, StandardCharsets.UTF_8))
                        .build();

                kinesisClient.putRecord(request);
            }

            if (respectTiming) {
                Duration elapsed = Duration.between(startTime, Instant.now());
                System.out.println("Replay completed in " + elapsed + " with original timing");
            } else {
                System.out.println("Replay completed at maximum speed");
            }
        } finally {
            kinesisClient.close();
        }
    }

    public static void main(String[] args) throws Exception {
        String csvFile = System.getProperty("csv", "your_file.csv");
        String streamName = System.getProperty("stream", "demo-stream");
        String region = System.getProperty("region", "us-east-1");
        String partitionKey = System.getProperty("partition-key", "default");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        KinesisReplay replay = new KinesisReplay(csvFile, streamName, region, partitionKey, respectTiming);
        replay.replay();
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface Config {
  csvFile: string;
  streamName: string;
  region: string;
  partitionKey: string;
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Create Kinesis client
  const kinesisClient = new KinesisClient({ region: config.region });

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

    // Put record to Kinesis stream
    const command = new PutRecordCommand({
      StreamName: config.streamName,
      PartitionKey: config.partitionKey,
      Data: Buffer.from(row.message, 'utf-8'),
    });

    await kinesisClient.send(command);
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
  streamName: process.env.STREAM || 'demo-stream',
  region: process.env.REGION || 'us-east-1',
  partitionKey: process.env.PARTITION_KEY || 'default',
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
import boto3

def replay(csv_file, stream_name, region, partition_key, respect_timing):
    # Create Kinesis client
    kinesis_client = boto3.client('kinesis', region_name=region)

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

            # Put record to Kinesis stream
            kinesis_client.put_record(
                StreamName=stream_name,
                Data=message_body.encode('utf-8'),
                PartitionKey=partition_key
            )

    if respect_timing:
        elapsed = time.time() - start_time
        print(f"Replay completed in {elapsed:.2f}s with original timing")
    else:
        print("Replay completed at maximum speed")

if __name__ == "__main__":
    parser = ArgumentParser(description='Replay Kinesis messages from CSV')
    parser.add_argument('--csv', default='your_file.csv', help='Path to CSV file')
    parser.add_argument('--stream', default='demo-stream', help='Kinesis stream name')
    parser.add_argument('--region', default='us-east-1', help='AWS region')
    parser.add_argument('--partition-key', default='default', help='Partition key for records')
    parser.add_argument('--respect-timing', action='store_true', help='Respect original message timing')

    args = parser.parse_args()
    replay(args.csv, args.stream, args.region, args.partition_key, args.respect_timing)
```

</TabItem>
</Tabs>

### Usage Examples

<Tabs>
<TabItem value="go" label="Go">

Send records as fast as possible (default):
```bash
go run main.go --csv your_file.csv --stream demo-stream --region us-east-1 --partition-key user-123
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --stream demo-stream --region us-east-1 --partition-key user-123 --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send records as fast as possible (default):
```bash
javac KinesisReplay.java
java -Dcsv=your_file.csv -Dstream=demo-stream -Dregion=us-east-1 -Dpartition-key=user-123 KinesisReplay
```

Respect original message timing from the recording:
```bash
java -Dcsv=your_file.csv -Dstream=demo-stream -Dregion=us-east-1 -Dpartition-key=user-123 -Drespect-timing=true KinesisReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send records as fast as possible (default):
```bash
CSV=your_file.csv STREAM=demo-stream REGION=us-east-1 PARTITION_KEY=user-123 npx ts-node main.ts
```

Respect original message timing from the recording:
```bash
CSV=your_file.csv STREAM=demo-stream REGION=us-east-1 PARTITION_KEY=user-123 RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send records as fast as possible (default):
```bash
python main.py --csv your_file.csv --stream demo-stream --region us-east-1 --partition-key user-123
```

Respect original message timing from the recording:
```bash
python main.py --csv your_file.csv --stream demo-stream --region us-east-1 --partition-key user-123 --respect-timing
```

</TabItem>
</Tabs>

### Using Kafka-Compatible API

If you're using Kinesis with the Kafka-compatible API, you can use standard Kafka client libraries. Configure your Kafka producer to connect to the Kinesis Kafka endpoint:

```go
producer, err := kafka.NewProducer(&kafka.ConfigMap{
	"bootstrap.servers": "your-kinesis-kafka-endpoint:9092",
	"security.protocol": "SASL_SSL",
	"sasl.mechanism": "AWS_MSK_IAM",
	// ... other Kafka config
})
```

For more details on using Kafka clients, see the [Kafka guide](./kafka.md).

:::note

Make sure to update the stream name, AWS region, partition key, and ensure you have proper AWS credentials configured (via environment variables, IAM role, or AWS credentials file). The partition key determines which shard the record goes to - use a consistent key if you need ordering, or vary it for better distribution. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

