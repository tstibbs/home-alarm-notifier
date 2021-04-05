import aws from 'aws-sdk'

const sqs = new aws.SQS({apiVersion: '2012-11-05'})

const queueUrl = process.env.QUEUE_URL

export async function handler(event, context) {
    let params = {
		MessageBody: "test message here",
		MessageGroupId: 'a',
		MessageDeduplicationId: '' + Date.now(),
		QueueUrl: queueUrl
	}
	console.log('sending message...')
    await sqs.sendMessage(params).promise()
	console.log('sent message.')
	return {
        statusCode: '200'
	}
}
