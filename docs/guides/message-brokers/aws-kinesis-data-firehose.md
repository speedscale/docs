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

An example script in Go is provided below:

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

### Usage Examples

Send records as fast as possible (default):
```bash
go run main.go --csv your_file.csv --stream demo-firehose-stream --region us-east-1
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --stream demo-firehose-stream --region us-east-1 --respect-timing
```

:::note

Make sure to update the delivery stream name, AWS region, and ensure you have proper AWS credentials configured (via environment variables, IAM role, or AWS credentials file). Kinesis Data Firehose delivery streams can be created via the AWS Console or CLI. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

Note: Kinesis Data Firehose automatically batches and delivers records to configured destinations. The delivery timing depends on your Firehose configuration (buffer size, buffer interval, etc.).

:::

