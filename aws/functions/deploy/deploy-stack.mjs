import {deploy, loadEnvs} from '@tstibbs/cloud-core-utils'

const stackName = 'home-alarm-notifier'
const templatePath = '../template.yml'
const capabilities = ['CAPABILITY_NAMED_IAM']
const artifacts = {
	'functions': {
		file: './dist/function.zip',
		versionParameterToInject: 'CodeVersionFunctions'
	}
}
const parameters = loadEnvs({
	IFTTT_KEY: 'IftttKey'
})
const {cfServiceRole} = loadEnvs({
	CF_ROLE_ARN: 'cfServiceRole' //e.g. arn:aws:iam::123456789:role/role-name'
})
deploy(stackName, templatePath, capabilities, cfServiceRole, artifacts, parameters)
