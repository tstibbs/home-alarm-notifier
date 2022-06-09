import cdk from '@aws-cdk/core'
import nodejsLambda from '@aws-cdk/aws-lambda-nodejs'
import lambda from '@aws-cdk/aws-lambda'
import iam from '@aws-cdk/aws-iam'
import apig from '@aws-cdk/aws-apigatewayv2'
import apigIntegrations from '@aws-cdk/aws-apigatewayv2-integrations'
import {CfnPolicy, TopicRule, IotSql} from '@aws-cdk/aws-iot'
import {LambdaFunctionAction} from '@aws-cdk/aws-iot-actions'
import {IFTTT_KEY} from './deploy-envs.js'
import {INCOMING_TOPIC_NAME, RESPONSE_TOPIC_NAME, RULE_NAME} from '../../../edge/app/constants.js'

const incomingTopicArn = `arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:topic/${INCOMING_TOPIC_NAME}`
const responseTopicArn = `arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:topic/${RESPONSE_TOPIC_NAME}`

class DeployStack extends cdk.Stack {
	constructor(scope, id, props) {
		super(scope, id, props)

		this.createIncomingElements()
		this.createNotificationElements()
		this.createEdgeElements()
	}

	createIncomingElements() {
		const incomingTriggerFunction = new nodejsLambda.NodejsFunction(this, 'incomingTriggerFunction', {
			entry: 'src/incomingTriggerFunction.js',
			memorySize: 128,
			timeout: cdk.Duration.seconds(20),
			runtime: lambda.Runtime.NODEJS_14_X
		})
		incomingTriggerFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: ['iot:Publish'],
			resources: [incomingTopicArn]
		}))
		incomingTriggerFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: ['iot:DescribeEndpoint'],
			resources: ['*']
		}))
		
		const incomingInterfaceApi = new apig.HttpApi(this, 'incomingInterfaceApi', {
			apiName: `${cdk.Aws.STACK_NAME}-incomingInterfaceApi`
		})
		incomingInterfaceApi.addRoutes({
			path: '/home-alarm-notification-trigger',
			methods: [ apig.HttpMethod.GET ],
			integration: new apigIntegrations.LambdaProxyIntegration({
				handler: incomingTriggerFunction
			})
		})
	}

	createNotificationElements() {
		const notificationFunction = new nodejsLambda.NodejsFunction(this, 'notificationFunction', {
			entry: 'src/notificationFunction.js',
			environment: {
				IFTTT_KEY
			},
			memorySize: 128,
			timeout: cdk.Duration.seconds(20),
			runtime: lambda.Runtime.NODEJS_14_X
		})

		new TopicRule(this, 'topicRule', {
			topicRuleName: RULE_NAME,
			sql: IotSql.fromStringAsVer20160323("SELECT *"),
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
						Resource: `arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:topicfilter/${INCOMING_TOPIC_NAME}`
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
