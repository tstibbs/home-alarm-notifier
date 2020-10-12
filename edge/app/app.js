import util from 'util'
import {exec as nodeExec} from 'child_process'
import AWS from 'aws-sdk'

const exec = util.promisify(nodeExec)
AWS.config.loadFromPath(process.env.AWS_CREDENTIALS_FILE);
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const queueUrl = `https://sqs.${process.env.aws_region}.amazonaws.com/${process.env.aws_account}/${process.env.aws_queue_name}`;
const devicePings = process.env.DEVICES.split(',');
const notificationFunctionName = process.env.notification_function_name

async function poll() {
	let params = {
		QueueUrl: queueUrl,
		VisibilityTimeout: '60',
		WaitTimeSeconds: '3'
	};
	let data = await sqs.receiveMessage(params).promise()
	if (data.Messages != null && data.Messages.length > 0) {
		console.log(`Message recieved - ${new Date()}`);
		await processEvent()
		let promises = data.Messages.map(async message => {
			await deleteMessage(message.ReceiptHandle);
		});
		await Promise.all(promises);
	}
	await poll();
}

async function deleteMessage(handle) {
	let params = {
		QueueUrl: queueUrl,
		ReceiptHandle: handle
	};
	await sqs.deleteMessage(params).promise();
}

async function wait(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve()
		}, time)
	})
}

async function processEvent() {
	//ideally would ping every 10 seconds, waiting up to a minute in total
	await wait(5000)
	await checkDevices()
}

async function checkDevices() {
	let pings = await Promise.all(devicePings.map(isAccessible));
	console.log(devicePings);
	console.log(pings);
	let success = pings.includes(true);
	console.log(`Ping success=${success} - ${new Date()}`);
	let params = {
		FunctionName: notificationFunctionName,
		Payload: JSON.stringify({
			"event": "disarmed",
			"situation": "home owner " + (success? "was " : "not ") + "present"
		})
	};
	await lambda.invoke(params).promise();
}

async function isAccessible(devicePing) {
	console.log(`Executing: ${devicePing} - ${new Date()}`)
	try {
		await exec(devicePing)
		console.log(`Success for: ${devicePing} - ${new Date()}`)
		return true
	} catch (err) {
		console.log(`Failed for: ${devicePing} - ${new Date()}`)
		console.error(err)
		return false
	}
}

export {poll, checkDevices}
