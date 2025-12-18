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

Create a custom load producer using Kafka client libraries configured for Azure Event Hubs. The steps are:

1. Read the CSV from the previous step
2. Create a Kafka producer configured for Event Hubs
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Send the message to Event Hubs
7. Wait for the producer flush to complete

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
		"security.protocol":  "SASL_SSL",
		"sasl.mechanism":     "PLAIN",
		"sasl.username":      *saslUsername,
		"sasl.password":      *saslPassword,
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

### Usage Examples

Send messages as fast as possible (default):
```bash
go run main.go --csv out.csv --topic demo-topic --brokers your-namespace.servicebus.windows.net:9093 --sasl-password "Endpoint=sb://..."
```

Respect original message timing from the recording:
```bash
go run main.go --csv out.csv --topic demo-topic --brokers your-namespace.servicebus.windows.net:9093 --sasl-password "Endpoint=sb://..." --respect-timing
```

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

