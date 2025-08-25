import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const broker = process.env.KAFKA_BROKER || 'localhost:9092';
const clientId = process.env.KAFKA_CLIENT_ID || 'demo-client';
const topic = process.env.KAFKA_TOPIC || 'demo-topic';
const messageCount = parseInt(process.env.MESSAGE_COUNT || '10', 10);

async function ensureTopicExists(kafka, topicName) {
	const admin = kafka.admin();
	await admin.connect();
	try {
		const topics = await admin.listTopics();
		if (!topics.includes(topicName)) {
			await admin.createTopics({
				topics: [{ topic: topicName, numPartitions: 1, replicationFactor: 1 }],
				waitForLeaders: true,
			});
			console.log(`Created topic: ${topicName}`);
		}
	} finally {
		await admin.disconnect();
	}
}

async function run() {
	const kafka = new Kafka({ clientId, brokers: [broker], logLevel: logLevel.ERROR });
	await ensureTopicExists(kafka, topic);

	const producer = kafka.producer();
	await producer.connect();
	console.log(`Producer connected to ${broker}. Sending ${messageCount} messages to topic '${topic}'...`);

	const messages = Array.from({ length: messageCount }).map((_, i) => ({
		key: `key-${i + 1}`,
		value: JSON.stringify({ index: i + 1, at: new Date().toISOString() }),
	}));

	await producer.send({ topic, messages });
	console.log('Messages sent.');
	await producer.disconnect();
}

run().catch((err) => {
	console.error('Producer error:', err);
	process.exit(1);
}); 