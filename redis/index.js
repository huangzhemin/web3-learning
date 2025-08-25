import 'dotenv/config';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function demoKeyValue(client) {
	console.log('\n== Key/Value ==');
	await client.set('demo:greeting', 'hello');
	const value = await client.get('demo:greeting');
	console.log('get demo:greeting ->', value);
}

async function demoList(client) {
	console.log('\n== List ==');
	const key = 'demo:letters';
	await client.del(key);
	await client.rPush(key, ['a', 'b', 'c']);
	const len = await client.lLen(key);
	console.log('llen demo:letters ->', len);
	const arr = await client.lRange(key, 0, -1);
	console.log('lrange demo:letters 0 -1 ->', arr);
}

async function demoHash(client) {
	console.log('\n== Hash ==');
	const key = 'demo:user:42';
	await client.hSet(key, {
		id: '42',
		name: 'alice',
		email: 'alice@example.com'
	});
	const fields = await client.hGetAll(key);
	console.log('hgetall demo:user:42 ->', fields);
}

async function demoPubSub(baseClient) {
	console.log('\n== Pub/Sub ==');
	const channel = 'demo:channel';

	const subscriber = baseClient.duplicate();
	await subscriber.connect();

	await subscriber.subscribe(channel, (message) => {
		console.log('subscriber received ->', message);
	});

	const publisher = baseClient.duplicate();
	await publisher.connect();

	await publisher.publish(channel, 'first message');
	await publisher.publish(channel, 'second message');

	// small delay to ensure messages are processed
	await new Promise((r) => setTimeout(r, 200));

	await subscriber.unsubscribe(channel);
	await subscriber.disconnect();
	await publisher.disconnect();
}

async function main() {
	const client = createClient({ url: REDIS_URL });
	client.on('error', (err) => console.error('Redis Client Error', err));

	console.log('Connecting to', REDIS_URL);
	await client.connect();
	console.log('Connected.');

	try {
		await demoKeyValue(client);
		await demoList(client);
		await demoHash(client);
		await demoPubSub(client);
	} finally {
		await client.disconnect();
		console.log('\nDisconnected.');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
}); 