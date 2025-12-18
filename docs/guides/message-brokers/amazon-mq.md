---
title: Replaying Amazon MQ
sidebar_position: 2
---

## Background

Amazon MQ is a managed message broker service that provides fully managed ActiveMQ or RabbitMQ brokers. Since Amazon MQ offers both ActiveMQ and RabbitMQ, you can use the same approaches as those brokers:

- **ActiveMQ**: Uses AMQP 1.0 protocol (see [Apache ActiveMQ guide](./apache-activemq.md))
- **RabbitMQ**: Uses AMQP 0.9.1 protocol (see [RabbitMQ guide](./rabbitmq.md))

Amazon MQ brokers are accessible via standard AMQP protocols, making them compatible with Speedscale's message broker replay capabilities.

For more information about Amazon MQ, see the [Amazon MQ documentation](https://aws.amazon.com/amazon-mq/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Amazon MQ provides managed ActiveMQ or RabbitMQ brokers, you can use the same replay approaches as those brokers:

1. **Capture Production Traffic**: Use Speedscale to capture your application's interactions with Amazon MQ
2. **Create a Snapshot**: [Create a snapshot](/guides/creating-a-snapshot.md) from the captured traffic
3. **Run a Replay**: Use Speedscale's standard replay functionality or custom load drivers

For detailed instructions on using Speedscale's standard replay capabilities, see the [Getting Started Guide](/quick-start.md).

## Broker-Specific Guides

Choose the appropriate guide based on your Amazon MQ broker type:

- **For ActiveMQ brokers**: See the [Apache ActiveMQ guide](./apache-activemq.md) - uses AMQP 1.0 protocol
- **For RabbitMQ brokers**: See the [RabbitMQ guide](./rabbitmq.md) - uses AMQP 0.9.1 protocol

## Amazon MQ Configuration

Amazon MQ brokers are accessible via standard AMQP endpoints. You'll need:

1. **Broker endpoint**: Found in AWS Console under Amazon MQ → Brokers → Your broker → Details
2. **Username and password**: Set when creating the broker or via AWS Secrets Manager
3. **Broker type**: ActiveMQ or RabbitMQ (determines which protocol to use)

### Connection URLs

- **ActiveMQ**: `amqps://broker-id.mq.us-east-1.amazonaws.com:5671`
- **RabbitMQ**: `amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671`

Note: Amazon MQ uses TLS (amqps://) by default. Ensure your client libraries support TLS.

## Alternative: Custom Load Driver Approach

### For ActiveMQ Brokers

Extract message payloads from ActiveMQ AMQP 1.0 traffic:

```bash
speedctl extract data <snapshot-id> --path .AmqpV10.server.transfer.body --path .ts
```

Then follow the steps in the [Apache ActiveMQ guide](./apache-activemq.md) for creating your producer, using the Amazon MQ broker endpoint.

### For RabbitMQ Brokers

Extract message payloads from RabbitMQ AMQP 0.9.1 traffic:

```bash
speedctl extract data <snapshot-id> --path .AmqpV091.server.basic.deliver.body --path .ts
```

Then follow the steps in the [RabbitMQ guide](./rabbitmq.md) for creating your producer, using the Amazon MQ broker endpoint.

### Example: RabbitMQ on Amazon MQ

An example script in Go for RabbitMQ brokers on Amazon MQ:

```go
package main

import (
	"encoding/base64"
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "your_file.csv", "Path to CSV file")
	queueName     = flag.String("queue", "demo-queue", "Queue name")
	amqpURL       = flag.String("url", "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671", "Amazon MQ connection URL")
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

	// Connect to Amazon MQ
	conn, err := amqp.Dial(*amqpURL)
	if err != nil {
		return fmt.Errorf("failed to connect to Amazon MQ: %w", err)
	}
	defer conn.Close()

	// Create a channel
	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open channel: %w", err)
	}
	defer ch.Close()

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
		bodyString, err := base64.StdEncoding.DecodeString(messageBody)
		if err != nil {
			return fmt.Errorf("failed to decode message body: %w", err)
		}

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

		// Publish message to Amazon MQ
		err = ch.Publish(
			"",         // exchange
			*queueName, // routing key (queue name)
			false,      // mandatory
			false,      // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        bodyString,
			},
		)
		if err != nil {
			return fmt.Errorf("failed to publish message to Amazon MQ: %w", err)
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

Send messages as fast as possible (default):
```bash
go run main.go --csv your_file.csv --queue demo-queue --url "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671"
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --queue demo-queue --url "amqps://username:password@broker-id.mq.us-east-1.amazonaws.com:5671" --respect-timing
```

:::note

Make sure to update the connection URL with your Amazon MQ broker endpoint, queue name, and credentials. Amazon MQ uses TLS by default, so ensure your client libraries support TLS/SSL connections.

- For **ActiveMQ brokers**, use AMQP 1.0 client libraries and follow the [Apache ActiveMQ guide](./apache-activemq.md)
- For **RabbitMQ brokers**, use AMQP 0.9.1 client libraries and follow the [RabbitMQ guide](./rabbitmq.md)

Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

