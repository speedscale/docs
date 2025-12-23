---
title: Replaying AWS Kinesis Data Firehose
sidebar_position: 6
---

## Background

AWS Kinesis Data Firehose uses HTTP-based APIs, which means you can use Speedscale's standard replay capabilities to capture and replay Firehose traffic. Unlike protocol-specific brokers like Kafka or RabbitMQ, Firehose traffic can be replayed directly using Speedscale's standard HTTP replay functionality.

Kinesis Data Firehose is a fully managed service for delivering real-time streaming data to destinations such as Amazon S3, Amazon Redshift, Amazon Elasticsearch Service, and Splunk. It automatically handles data transformation, compression, and delivery.

For more information about AWS Kinesis Data Firehose, see the [AWS Kinesis Data Firehose documentation](https://aws.amazon.com/kinesis/data-firehose/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since AWS Kinesis Data Firehose uses HTTP-based APIs, you can use Speedscale's standard replay capabilities:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with AWS Kinesis Data Firehose
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality to replay the traffic

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Alternative: Custom Load Driver Approach

If you need more control over message replay patterns or want to extract and replay messages independently, you can use a custom load driver approach similar to Kafka and RabbitMQ:

### Extract the data

Grab your snapshot id and run this command to extract message payloads from Firehose traffic:

```bash
speedctl extract data <snapshot-id> --path .http.request.body --path .ts
```

This will generate a CSV with message data, timestamps, and corresponding RRPair UUIDs.

### Create your producer

Create a custom load producer using the AWS SDK for your preferred language. The steps are:

1. Read the CSV from the previous step
2. Create an AWS Kinesis Data Firehose client
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Put the record to the Firehose delivery stream
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
	"github.com/aws/aws-sdk-go/service/firehose"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "your_file.csv", "Path to CSV file")
	streamName    = flag.String("stream", "demo-firehose-stream", "Firehose delivery stream name")
	region        = flag.String("region", "us-east-1", "AWS region")
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

	// Create Firehose client
	svc := firehose.New(sess)

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

		// Put record to Firehose delivery stream
		_, err = svc.PutRecord(&firehose.PutRecordInput{
			DeliveryStreamName: aws.String(*streamName),
			Record: &firehose.Record{
				Data: messageBody,
			},
		})
		if err != nil {
			return fmt.Errorf("failed to put record to Firehose: %w", err)
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
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.firehose.FirehoseClient;
import software.amazon.awssdk.services.firehose.model.*;
import java.io.*;
import java.time.Duration;
import java.time.Instant;
import java.nio.charset.StandardCharsets;

public class FirehoseReplay {
    private final String csvFile;
    private final String streamName;
    private final String region;
    private final boolean respectTiming;

    public FirehoseReplay(String csvFile, String streamName, String region, boolean respectTiming) {
        this.csvFile = csvFile;
        this.streamName = streamName;
        this.region = region;
        this.respectTiming = respectTiming;
    }

    public void replay() throws Exception {
        // Create Firehose client
        try (FirehoseClient firehoseClient = FirehoseClient.builder()
                .region(Region.of(region))
                .build();
             BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {

            // Skip header row
            reader.readLine();

            Instant lastTimestamp = null;
            Instant startTime = Instant.now();

            String line;
            while ((line = reader.readLine()) != null) {
                String[] columns = line.split(",", -1);
                String messageBody = columns[0].replaceAll("^\"|\"$", ""); // Remove quotes
                byte[] bodyBytes = messageBody.getBytes(StandardCharsets.UTF_8);

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

                // Put record to Firehose delivery stream
                Record record = Record.builder()
                        .data(SdkBytes.fromByteArray(bodyBytes))
                        .build();

                PutRecordRequest request = PutRecordRequest.builder()
                        .deliveryStreamName(streamName)
                        .record(record)
                        .build();

                firehoseClient.putRecord(request);
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
        String streamName = System.getProperty("stream", "demo-firehose-stream");
        String region = System.getProperty("region", "us-east-1");
        boolean respectTiming = Boolean.parseBoolean(System.getProperty("respect-timing", "false"));

        FirehoseReplay replay = new FirehoseReplay(csvFile, streamName, region, respectTiming);
        replay.replay();
    }
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { FirehoseClient, PutRecordCommand } from '@aws-sdk/client-firehose';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface Config {
  csvFile: string;
  streamName: string;
  region: string;
  respectTiming: boolean;
}

async function replay(config: Config): Promise<void> {
  // Create Firehose client
  const firehoseClient = new FirehoseClient({ region: config.region });

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

    // Put record to Firehose delivery stream
    const command = new PutRecordCommand({
      DeliveryStreamName: config.streamName,
      Record: {
        Data: Buffer.from(row.message, 'utf-8'),
      },
    });

    await firehoseClient.send(command);
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
  streamName: process.env.STREAM || 'demo-firehose-stream',
  region: process.env.REGION || 'us-east-1',
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

def replay(csv_file, stream_name, region, respect_timing):
    # Create Firehose client
    firehose = boto3.client('firehose', region_name=region)

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

            # Put record to Firehose delivery stream
            firehose.put_record(
                DeliveryStreamName=stream_name,
                Record={
                    'Data': message_body.encode('utf-8')
                }
            )

    if respect_timing:
        elapsed = time.time() - start_time
        print(f"Replay completed in {elapsed:.2f}s with original timing")
    else:
        print("Replay completed at maximum speed")

if __name__ == "__main__":
    parser = ArgumentParser(description='Replay AWS Kinesis Data Firehose records from CSV')
    parser.add_argument('--csv', default='your_file.csv', help='Path to CSV file')
    parser.add_argument('--stream', default='demo-firehose-stream', help='Firehose delivery stream name')
    parser.add_argument('--region', default='us-east-1', help='AWS region')
    parser.add_argument('--respect-timing', action='store_true', help='Respect original message timing')

    args = parser.parse_args()
    replay(args.csv, args.stream, args.region, args.respect_timing)
```

</TabItem>
</Tabs>

### Usage Examples

<Tabs>
<TabItem value="go" label="Go">

Send records as fast as possible (default):
```bash
go run main.go --csv your_file.csv --stream demo-firehose-stream --region us-east-1
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --stream demo-firehose-stream --region us-east-1 --respect-timing
```

</TabItem>
<TabItem value="java" label="Java">

Send records as fast as possible (default):
```bash
javac FirehoseReplay.java
java -Dcsv=your_file.csv -Dstream=demo-firehose-stream -Dregion=us-east-1 FirehoseReplay
```

Respect original message timing from the recording:
```bash
java -Dcsv=your_file.csv -Dstream=demo-firehose-stream -Dregion=us-east-1 -Drespect-timing=true FirehoseReplay
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Send records as fast as possible (default):
```bash
CSV=your_file.csv STREAM=demo-firehose-stream REGION=us-east-1 npx ts-node main.ts
```

Respect original message timing from the recording:
```bash
CSV=your_file.csv STREAM=demo-firehose-stream REGION=us-east-1 RESPECT_TIMING=true npx ts-node main.ts
```

</TabItem>
<TabItem value="python" label="Python">

Send records as fast as possible (default):
```bash
python main.py --csv your_file.csv --stream demo-firehose-stream --region us-east-1
```

Respect original message timing from the recording:
```bash
python main.py --csv your_file.csv --stream demo-firehose-stream --region us-east-1 --respect-timing
```

</TabItem>
</Tabs>

:::note

Make sure to update the delivery stream name, AWS region, and ensure you have proper AWS credentials configured (via environment variables, IAM role, or AWS credentials file). Kinesis Data Firehose delivery streams can be created via the AWS Console or CLI. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

Note: Kinesis Data Firehose automatically batches and delivers records to configured destinations. The delivery timing depends on your Firehose configuration (buffer size, buffer interval, etc.).

:::

