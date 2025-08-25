# Redis Demo

Simple Node.js demo using `redis` v4 client.

## Prerequisites
- Node.js >= 18
- Redis server (via Docker or local install)

## Start Redis with Docker
```bash
cd redis
docker compose up -d
```

## Configure
Copy `.env.example` to `.env` if you want to override the default URL.
```bash
cp .env.example .env
# optionally edit .env
```

## Install and run
```bash
npm install
npm start
```

You should see outputs for key/value, lists, hashes, and pub/sub. 