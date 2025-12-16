---
title: Replaying RabbitMQ
---

## Background

In this guide we will show you how to replay RabbitMQ traffic using data captured by Speedscale. The network level modelling of AMQP does not match most people's mental model which leads to confusion and an undesirable replay scenario. Most people view their app interacting with RabbitMQ like this.

```mermaid
sequenceDiagram
    RabbitMQ->>App: Message Delivered
    App-->>RabbitMQ: Ack
```

when the reality looks more like this

```mermaid
sequenceDiagram
    App->>RabbitMQ: Open Connection
    RabbitMQ-->>App: Connection OK
    App->>RabbitMQ: Open Channel
    RabbitMQ-->>App: Channel OK
    App->>RabbitMQ: Subscribe to Queue (Basic.Consume)
    RabbitMQ-->>App: Consume OK
    RabbitMQ->>App: Basic.Deliver (Message)
    App-->>RabbitMQ: Basic.Ack
```

This is why when observed in Speedscale, you see something like this that has a lot of internal AMQP protocol calls along with the most important `Basic.Deliver` messages.

This sort of inbound traffic would typically be played back during a replay. In the case of RabbitMQ however, we can simplify the replay process by extracting `Basic.Deliver` messages and converting them into `Basic.Publish` calls controlled by our homemade load driver.

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
1. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Extract the data

Grab your snapshot id and run this command. This will extract the message body from RabbitMQ Basic.Deliver frames which is deeply nested in Speedscale's RRPair format.

```bash
speedctl extract data <snapshot-id> --path .AmqpV091.server.basic.deliver.body --filter='(command IS "Basic.Deliver")'
```

This will generate a csv that looks something like this, a CSV of the data we extracted from all the RabbitMQ message deliveries and the corresponding RRPair UUID (not needed in this case)

```csv
.AmqpV091.server.basic.deliver.body,RRPair UUID
"message1",44f7a2cc-2045-4fb6-9635-3da8aa7fa909
"message2",58f7a2cc-1135-4fa6-3433-ada5aa2fa161
```

:::tip

This example assumes the message body is in the standard location. If you need to extract additional metadata like routing keys, exchange names, or headers, see `speedctl extract data --help` for advanced path expressions.

:::

## Create your producer

Next up, using the language and LLM of your choice, create a small load producer to send these messages to your RabbitMQ broker. The steps here are

1. Read the CSV from our previous step.
1. Create a RabbitMQ connection and channel.
1. Iterate over the CSV.
1. For each row in the CSV, extract the first column and publish it as a message to RabbitMQ after base64 decoding it.
1. Close the connection when complete.

An example script in Go is provided below. You can also find a complete demo app with this generator in our demo [repository](https://github.com/speedscale/demo/tree/master/go-rabbitmq).

```go
package main

import (
	"encoding/base64"
	"encoding/csv"
	"fmt"
	"io"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
	if err := do(); err != nil {
		panic(err)
	}
}

func do() error {
	// Open CSV file
	file, err := os.Open("your_file.csv")
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

	// Connect to RabbitMQ
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}
	defer conn.Close()

	// Create a channel
	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open channel: %w", err)
	}
	defer ch.Close()

	// Iterate over CSV rows
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read CSV row: %w", err)
		}

		// Using the first column only
		messageBody := row[0]
		bodyString, err := base64.StdEncoding.DecodeString(messageBody)
		if err != nil {
			return fmt.Errorf("failed to decode message body: %w", err)
		}

		// Publish message to RabbitMQ
		err = ch.Publish(
			"",           // exchange (use default)
			"demo-queue", // routing key (your queue name)
			false,        // mandatory
			false,        // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        []byte(bodyString),
			},
		)
		if err != nil {
			return fmt.Errorf("failed to publish message to RabbitMQ: %w", err)
		}
	}

	return nil
}```

:::note

Make sure to update the connection string, queue name, and exchange settings to match your RabbitMQ configuration. You may also want to add delays between messages to control the replay rate.

:::
