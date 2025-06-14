import {Stack, Duration, Aws, CfnOutput} from 'aws-cdk-lib'
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs'
import {Runtime} from 'aws-cdk-lib/aws-lambda'
import {PolicyStatement} from 'aws-cdk-lib/aws-iam'
import {HttpApi, HttpMethod} from 'aws-cdk-lib/aws-apigatewayv2'
import {HttpLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import {CfnPolicy} from 'aws-cdk-lib/aws-iot'
import {TopicRule, IotSql} from '@aws-cdk/aws-iot-alpha'
import {LambdaFunctionAction} from '@aws-cdk/aws-iot-actions-alpha'

import {applyStandardTags} from '@tstibbs/cloud-core-utils'
import {addUsageTrackingToHttpApi} from '@tstibbs/cloud-core-utils/src/stacks/usage-tracking.js'

import {IFTTT_KEY} from './deploy-envs.js'
import {INCOMING_TOPIC_NAME, RESPONSE_TOPIC_NAME, RULE_NAME} from '../../../edge/app/constants.js'

const triggerPath = 'home-alarm-notification-trigger'
const incomingTopicArn = `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topic/${INCOMING_TOPIC_NAME}`
const responseTopicArn = `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topic/${RESPONSE_TOPIC_NAME}`

class DeployStack extends Stack {
	constructor(scope, id, props) {
		super(scope, id, props)

		this.createIncomingElements()
		this.createNotificationElements()
		this.createEdgeElements()
		applyStandardTags(this)
	}

	createIncomingElements() {
		const incomingTriggerFunction = new NodejsFunction(this, 'incomingTriggerFunction', {
			entry: 'src/incomingTriggerFunction.js',
			memorySize: 128,
			timeout: Duration.seconds(20),
			runtime: Runtime.NODEJS_22_X
		})
		incomingTriggerFunction.addToRolePolicy(
			new PolicyStatement({
				actions: ['iot:Publish'],
				resources: [incomingTopicArn]
			})
		)
		incomingTriggerFunction.addToRolePolicy(
			new PolicyStatement({
				actions: ['iot:DescribeEndpoint'],
				resources: ['*']
			})
		)

		const incomingInterfaceApi = new HttpApi(this, 'incomingInterfaceApi', {
			apiName: `${Aws.STACK_NAME}-incomingInterfaceApi`
		})
		addUsageTrackingToHttpApi(incomingInterfaceApi)

		const incomingTriggerIntegration = new HttpLambdaIntegration('incomingTriggerIntegration', incomingTriggerFunction)
		incomingInterfaceApi.addRoutes({
			path: `/${triggerPath}`,
			methods: [HttpMethod.GET],
			integration: incomingTriggerIntegration
		})

		new CfnOutput(this, 'triggerUrl', {value: `${incomingInterfaceApi.url}${triggerPath}`})
	}

	createNotificationElements() {
		const notificationFunction = new NodejsFunction(this, 'notificationFunction', {
			entry: 'src/notificationFunction.js',
			environment: {
				IFTTT_KEY
			},
			memorySize: 128,
			timeout: Duration.seconds(20),
			runtime: Runtime.NODEJS_22_X
		})

		new TopicRule(this, 'topicRule', {
			topicRuleName: RULE_NAME,
			sql: IotSql.fromStringAsVer20160323('SELECT *'),
			actions: [new LambdaFunctionAction(notificationFunction)]
		})
	}

	createEdgeElements() {
		new CfnPolicy(this, 'edgeTriggerPolicy', {
			policyDocument: {
				Version: '2012-10-17',
				Statement: [
					{
						Effect: 'Allow',
						Action: 'iot:Subscribe',
						Resource: `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topicfilter/${INCOMING_TOPIC_NAME}`
					},
					{
						Effect: 'Allow',
						Action: 'iot:Receive',
						Resource: incomingTopicArn
					},
					{
						Effect: 'Allow',
						Action: 'iot:Publish',
						Resource: responseTopicArn
					}
				]
			}
		})
	}
}

export {DeployStack}
