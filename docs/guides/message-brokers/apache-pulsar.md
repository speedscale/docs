---
title: Replaying Apache Pulsar
sidebar_position: 4
---

## Background

Apache Pulsar supports multiple protocols: Kafka-compatible API (primary), HTTP REST API, and gRPC. Since Pulsar provides a Kafka-compatible API, you can use standard Kafka client libraries to interact with Pulsar, making it compatible with Speedscale's Kafka replay approach. Pulsar also supports HTTP REST and gRPC APIs for management and alternative messaging patterns.

For more information about Apache Pulsar, see the [Apache Pulsar documentation](https://pulsar.apache.org/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Apache Pulsar uses Kafka-compatible APIs, you can use Speedscale's standard replay capabilities with Kafka client libraries:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with Apache Pulsar
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality to replay the traffic

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Alternative: Custom Load Driver Approach

Apache Pulsar supports multiple protocols. The most common approach is using the Kafka-compatible API, which allows you to extract and replay traffic using the same approach as Kafka. For detailed information on extracting Kafka traffic, see the [Kafka guide](./kafka.md).

### Method 1: Using Kafka-Compatible API

Pulsar's Kafka-compatible API allows you to use standard Kafka client libraries. Extract message data and timestamps from Pulsar Kafka traffic:

```bash
speedctl extract data <snapshot-id> --path kafka.response.FetchResponse.topics.0.partitions.0.records.records.0.valueString --path .ts --filter='(command IS  "Fetch")'
```

### Method 2: Using HTTP REST API

If you're using Pulsar's HTTP REST API, extract message payloads:

```bash
speedctl extract data <snapshot-id> --path .http.request.body --path .ts
```

### Method 3: Using gRPC API

If you're using Pulsar's gRPC API, you can extract data from gRPC messages. See Speedscale's [gRPC documentation](/observe/bodies.md#grpc) for details on extracting gRPC traffic.

### Create your producer

Create a custom load producer using Kafka client libraries (for Kafka-compatible API), HTTP client (for REST API), or gRPC client (for gRPC API). The steps are:

1. Read the CSV from the previous step
2. Create a Kafka producer, HTTP client, or gRPC client configured for Pulsar
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Send the message to Pulsar
7. Wait for delivery confirmation

An example script in Go using Kafka-compatible API is provided below:

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
	topic         = flag.String("topic", "persistent://public/default/demo-topic", "Pulsar topic name")
	brokers       = flag.String("brokers", "localhost:6650", "Pulsar broker addresses")
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

	// Create Kafka producer configured for Pulsar
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": *brokers,
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
				Topic:     *topic,
				Partition: kafka.PartitionAny,
			},
			Value: []byte(messageBody),
		}

		// Produce message to Pulsar
		if err := producer.Produce(msg, nil); err != nil {
			return fmt.Errorf("failed to produce message to Pulsar: %w", err)
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
go run main.go --csv out.csv --topic persistent://public/default/demo-topic --brokers localhost:6650
```

Respect original message timing from the recording:
```bash
go run main.go --csv out.csv --topic persistent://public/default/demo-topic --brokers localhost:6650 --respect-timing
```

### Pulsar Configuration

Pulsar topics use a hierarchical naming scheme: `persistent://tenant/namespace/topic-name` or `non-persistent://tenant/namespace/topic-name`. When using the Kafka-compatible API, you can use these full topic names directly.

For authentication, Pulsar supports multiple methods:
- TLS authentication
- OAuth2
- Basic authentication
- JWT tokens

Configure these in your Kafka client's configuration map as needed.

:::note

Make sure to update the topic name (using Pulsar's hierarchical naming), broker addresses, and authentication settings. Pulsar's Kafka-compatible API allows you to use standard Kafka client libraries, making it easy to integrate with existing Kafka-based applications.

For more details on extracting and working with Kafka traffic, see the [Kafka guide](./kafka.md). For HTTP REST API usage, see the [Getting Started Guide](/quick-start.md). Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

