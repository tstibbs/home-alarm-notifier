import aws from 'aws-sdk'

import {INCOMING_TOPIC_NAME} from '../../../edge/app/constants.js'

const iot = new aws.Iot({
	apiVersion: '2015-05-28'
})
const dataEndpointPromise = buildIotDataApi()

async function buildIotDataApi() {
	const endpointResponse = await iot
		.describeEndpoint({
			endpointType: 'iot:Data-ATS'
		})
		.promise()
	const iotdata = new aws.IotData({
		endpoint: endpointResponse.endpointAddress,
		apiVersion: '2015-05-28'
	})
	return iotdata
}

export async function handler(event, context) {
	let iotdata = await dataEndpointPromise //workaround until we can use top level await
	console.log('sending message...')
	await iotdata
		.publish({
			topic: INCOMING_TOPIC_NAME,
			payload: null,
			qos: '1'
		})
		.promise()
	console.log('sent message.')
	return {
		statusCode: '200'
	}
}
