import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const broker = process.env.KAFKA_BROKER || 'localhost:9092';
const clientId = process.env.KAFKA_CLIENT_ID || 'demo-client';
const groupId = process.env.KAFKA_GROUP_ID || 'demo-group';
const topic = process.env.KAFKA_TOPIC || 'demo-topic';

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
	const consumer = kafka.consumer({ groupId });
	await consumer.connect();
	console.log(`Consumer connected to ${broker}. Subscribing to '${topic}'...`);
	await consumer.subscribe({ topic, fromBeginning: true });

	await consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
			const prefix = `${topic}[${partition}] | offset ${message.offset}`;
			console.log(`${prefix} | key: ${message.key?.toString()} | value: ${message.value?.toString()}`);
		},
	});
}

run().catch((err) => {
	console.error('Consumer error:', err);
	process.exit(1);
}); 