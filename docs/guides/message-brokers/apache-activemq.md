---
title: Replaying Apache ActiveMQ
sidebar_position: 3
---

## Background

Apache ActiveMQ supports multiple protocols including AMQP 1.0, STOMP, MQTT, and OpenWire. Since ActiveMQ supports AMQP 1.0, you can use AMQP client libraries to interact with it, similar to RabbitMQ. However, note that ActiveMQ uses AMQP 1.0 (not AMQP 0.9.1 like RabbitMQ), so you'll need AMQP 1.0-compatible client libraries.

For more information about Apache ActiveMQ, see the [Apache ActiveMQ documentation](https://activemq.apache.org/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
2. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Standard Replay Approach

Since Apache ActiveMQ uses AMQP 1.0 protocol, you can extract and replay traffic using AMQP client libraries. For general AMQP concepts and extraction patterns, see the [RabbitMQ guide](./rabbitmq.md), but note that ActiveMQ uses AMQP 1.0 (not AMQP 0.9.1).

## Alternative: Custom Load Driver Approach

Apache ActiveMQ supports AMQP 1.0 protocol, so you can extract and replay traffic using AMQP client libraries. The extraction approach is similar to RabbitMQ, but you'll need AMQP 1.0-compatible clients.

### Extract the data

Grab your snapshot id and run this command to extract message payloads from ActiveMQ AMQP traffic:

```bash
speedctl extract data <snapshot-id> --path .AmqpV10.server.transfer.body --path .ts
```

This will generate a CSV with message data, timestamps, and corresponding RRPair UUIDs.

:::tip

This example assumes the message body is in the standard AMQP 1.0 location. If you need to extract additional metadata like routing keys, exchange names, or headers, see `speedctl extract data --help` for advanced path expressions.

:::

### Create your producer

Create a custom load producer using AMQP 1.0 client libraries. The steps are:

1. Read the CSV from the previous step
2. Create an AMQP 1.0 connection and session
3. Create a sender link
4. Iterate over the CSV
5. For each row, extract the message body and optionally the timestamp
6. If timing mode is enabled, wait between messages to match the original recording timing
7. Send the message to ActiveMQ
8. Close the connection when complete

An example script in Go using the `pack.ag/amqp` library (AMQP 1.0) is provided below:

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

	"pack.ag/amqp"
)

var (
	respectTiming = flag.Bool("respect-timing", false, "Respect original message timing from recording")
	csvFile       = flag.String("csv", "your_file.csv", "Path to CSV file")
	queueName     = flag.String("queue", "demo-queue", "ActiveMQ queue name")
	amqpURL       = flag.String("url", "amqp://localhost:5672", "ActiveMQ AMQP connection URL")
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

	// Connect to ActiveMQ via AMQP 1.0
	client, err := amqp.Dial(*amqpURL)
	if err != nil {
		return fmt.Errorf("failed to connect to ActiveMQ: %w", err)
	}
	defer client.Close()

	// Create a session
	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}

	// Create a sender
	sender, err := session.NewSender(
		amqp.LinkTargetAddress(*queueName),
	)
	if err != nil {
		return fmt.Errorf("failed to create sender: %w", err)
	}

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

		// Create AMQP message
		msg := amqp.NewMessage(messageBody)

		// Send message to ActiveMQ
		ctx := context.Background()
		err = sender.Send(ctx, msg)
		if err != nil {
			return fmt.Errorf("failed to send message to ActiveMQ: %w", err)
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
go run main.go --csv your_file.csv --queue demo-queue --url amqp://localhost:5672
```

Respect original message timing from the recording:
```bash
go run main.go --csv your_file.csv --queue demo-queue --url amqp://localhost:5672 --respect-timing
```

:::note

Make sure to update the connection URL, queue name, and ensure you have proper authentication configured if required. ActiveMQ uses AMQP 1.0 protocol, which differs from RabbitMQ's AMQP 0.9.1. Ensure you use AMQP 1.0-compatible client libraries.

For general AMQP concepts and extraction patterns, see the [RabbitMQ guide](./rabbitmq.md), but remember that ActiveMQ uses AMQP 1.0. Use the `--respect-timing` flag to preserve the original message timing patterns from your production traffic, or omit it to send messages as fast as possible for maximum throughput testing.

:::

