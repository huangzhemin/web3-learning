# Kafka Demo (Docker + KafkaJS)

## Prerequisites
- Docker and Docker Compose
- Node.js 18+

## Start Kafka (single-node KRaft)
```bash
cd Kafka
docker compose up -d
# wait for healthy
docker compose ps
```

## Setup Node project
```bash
cd Kafka
npm install
cp env.example .env  # or create .env manually
```

## Configure
Edit `.env` (or set env vars):
```
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=demo-client
KAFKA_GROUP_ID=demo-group
KAFKA_TOPIC=demo-topic
MESSAGE_COUNT=10
```

## Run consumer (in one terminal)
```bash
npm run consumer
```

## Run producer (in another terminal)
```bash
npm run producer
```

You should see the consumer log messages sent by the producer.

## Stop
```bash
docker compose down -v
``` 