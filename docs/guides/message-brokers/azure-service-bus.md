---
title: Replaying Azure Service Bus
sidebar_position: 10
---

## Background

Azure Service Bus supports multiple protocols: HTTP REST API (primary) and AMQP 1.0. Since Service Bus uses HTTP-based APIs as its primary interface, you can use Speedscale's standard replay capabilities to capture and replay Service Bus traffic. For applications using AMQP 1.0, you can also use a custom load driver approach similar to RabbitMQ.

For more information about Azure Service Bus, see the [Azure Service Bus documentation](https://azure.microsoft.com/en-us/products/service-bus).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Azure Service Bus uses HTTP-based APIs, you can use Speedscale's standard replay capabilities:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with Azure Service Bus
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality to replay the traffic

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Alternative: Custom Load Driver Approach

If you need more control over message replay patterns or want to extract and replay messages independently, you can use a custom load driver approach. Service Bus supports two methods:

### Method 1: Using HTTP REST API

Extract message payloads from Service Bus HTTP REST API traffic:

```bash
speedctl extract data <snapshot-id> --path .http.request.body --path .ts
```

### Method 2: Using AMQP 1.0 Protocol

If you're using Service Bus with AMQP 1.0, you can extract data similar to RabbitMQ:

```bash
speedctl extract data <snapshot-id> --path .AmqpV10.server.transfer.body --path .ts
```

For more details on extracting AMQP traffic, see the [RabbitMQ guide](./rabbitmq.md).

### Create your producer

Create a custom load producer using the Azure Service Bus SDK (HTTP) or AMQP client libraries. The steps are:

1. Read the CSV from the previous step
2. Create a Service Bus client (Azure SDK) or AMQP connection (for AMQP protocol)
3. Iterate over the CSV
4. For each row, extract the message body and optionally the timestamp
5. If timing mode is enabled, wait between messages to match the original recording timing
6. Send the message to the Service Bus queue or topic
7. Close the client when complete

An example script in Go using the Azure Service Bus SDK is provided below:

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
	"github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus/admin"
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

### Usage Examples

Send messages to a queue as fast as possible (default):
```bash
go run main.go --csv your_file.csv --connection "Endpoint=sb://..." --queue demo-queue
```

Send messages to a topic with timing:
```bash
go run main.go --csv your_file.csv --connection "Endpoint=sb://..." --topic demo-topic --respect-timing
```

### Using AMQP 1.0 Protocol

If you're using Service Bus with AMQP 1.0, you can use AMQP client libraries similar to RabbitMQ. Note that Service Bus uses AMQP 1.0 (not AMQP 0.9.1 like RabbitMQ), so you'll need an AMQP 1.0-compatible client library.

For more details on using AMQP clients, see the [RabbitMQ guide](./rabbitmq.md) for general AMQP concepts, but use AMQP 1.0 client libraries for Service Bus.

:::note

Make sure to update the connection string, queue/topic name, and ensure you have proper Azure credentials configured. Service Bus connection strings can be obtained from the Azure Portal. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

Note: Azure Service Bus uses AMQP 1.0, which differs from RabbitMQ's AMQP 0.9.1. Ensure you use AMQP 1.0-compatible client libraries when using the AMQP protocol.

:::

