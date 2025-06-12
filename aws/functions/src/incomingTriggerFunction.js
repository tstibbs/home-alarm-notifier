import {IoT} from '@aws-sdk/client-iot'
import {IoTDataPlane} from '@aws-sdk/client-iot-data-plane'

import {defaultAwsClientConfig} from '@tstibbs/cloud-core-utils/src/tools/aws-client-config.js'
import {INCOMING_TOPIC_NAME} from '../../../edge/app/constants.js'

const iot = new IoT(defaultAwsClientConfig)
const dataEndpointPromise = buildIotDataApi()

async function buildIotDataApi() {
	const endpointResponse = await iot.describeEndpoint({
		endpointType: 'iot:Data-ATS'
	})

	const iotdata = new IoTDataPlane({
		endpoint: 'https://' + endpointResponse.endpointAddress,
		...defaultAwsClientConfig
	})
	return iotdata
}

export async function handler(event, context) {
	let iotdata = await dataEndpointPromise //workaround until we can use top level await
	console.log('sending message...')
	await iotdata.publish({
		topic: INCOMING_TOPIC_NAME,
		payload: null,
		qos: '1'
	})

	console.log('sent message.')
	return {
		statusCode: '200'
	}
}
