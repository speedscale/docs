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

### Create your producer

Create a custom load producer using the AWS SDK for Kinesis or Kafka client libraries. The steps are:

1. Read the CSV from the previous step
2. Create a Kinesis client (AWS SDK) or Kafka producer (for Kafka-compatible API)
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Put the record to the Kinesis stream
7. Close the client when complete

An example script in Go using the AWS SDK is provided below:

```go
package main

import (
	"encoding/csv"
	"encoding/json"
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

### Usage Examples

Send records as fast as possible (default):
```bash
go run main.go --csv your_file.csv --stream demo-stream --region us-east-1 --partition-key user-123
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --stream demo-stream --region us-east-1 --partition-key user-123 --respect-timing
```

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

