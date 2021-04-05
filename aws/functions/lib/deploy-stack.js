import cdk from '@aws-cdk/core'
import nodejsLambda from '@aws-cdk/aws-lambda-nodejs'
import lambda from '@aws-cdk/aws-lambda'
import iam from '@aws-cdk/aws-iam'
import apig from '@aws-cdk/aws-apigatewayv2'
import apigIntegrations from '@aws-cdk/aws-apigatewayv2-integrations'
import sqs from '@aws-cdk/aws-sqs'
import {IFTTT_KEY} from './deploy-envs.js'

class DeployStack extends cdk.Stack {
	constructor(scope, id, props) {
		super(scope, id, props)

		let cloudToEdgeQueue = new sqs.Queue(this, 'cloudToEdgeQueue', {
			fifo: true,
			visibilityTimeout: cdk.Duration.seconds(60),
			receiveMessageWaitTime: cdk.Duration.seconds(20),
			queueName: `${cdk.Aws.STACK_NAME}-CloudToEdgeQueue.fifo`
		})

		this.createIncomingElements(cloudToEdgeQueue)
		this.createNotificationElements(cloudToEdgeQueue)
	}

	createIncomingElements(cloudToEdgeQueue) {
		const incomingTriggerFunction = new nodejsLambda.NodejsFunction(this, 'incomingTriggerFunction', {
			entry: 'src/incomingTriggerFunction.js',
			environment: {
				QUEUE_URL: cloudToEdgeQueue.queueUrl
			},
			memorySize: 128,
			timeout: cdk.Duration.seconds(20),
			runtime: lambda.Runtime.NODEJS_14_X
		})
		incomingTriggerFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: ['sqs:SendMessage'],
			resources: [cloudToEdgeQueue.queueArn]
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

	createNotificationElements(cloudToEdgeQueue) {
		const notificationFunction = new nodejsLambda.NodejsFunction(this, 'notificationFunction', {
			entry: 'src/notificationFunction.js',
			environment: {
				IFTTT_KEY
			},
			memorySize: 128,
			timeout: cdk.Duration.seconds(20),
			runtime: lambda.Runtime.NODEJS_14_X,
			functionName: `${cdk.Aws.STACK_NAME}-notification-function`
		})

		let edgeProcessingPolicy = new iam.ManagedPolicy(this, 'edgeProcessingPolicy', {
			description: 'Policy for edge code to talk to the cloud code',
			statements: [
				new iam.PolicyStatement({
					actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage'],
					resources: [cloudToEdgeQueue.queueArn]
				}),
				new iam.PolicyStatement({
					actions: ['lambda:InvokeFunction'],
					resources: [notificationFunction.functionArn]
				})
			]
		})
	
		new iam.User(this, 'edgeProcessingUser', {
			managedPolicies: [edgeProcessingPolicy]
		})
	}
}

export {DeployStack}
