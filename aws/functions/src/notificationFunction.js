import https from 'https'
import dotenv from 'dotenv'

dotenv.config()

const iftttKey = process.env.IFTTT_KEY
const appletEvent = 'alarm-state-change-redacted'
const iftttTriggerUrl = `https://maker.ifttt.com/trigger/${appletEvent}/with/key/${iftttKey}`

export async function handler(event, context) {
	await sendRequest(event.event, event.situation)
}

function sendRequest(event, situation) {
	return new Promise((resolve, reject) => {
		let options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		}
		let postData = {value1: `Alarm ${event} - ${situation}`}
		console.log('Sending:\n' + JSON.stringify(postData, null, 2))
		console.log(`to: ${iftttTriggerUrl}`)
		const req = https.request(iftttTriggerUrl, options, res => {
			let statusCode = res.statusCode
			console.log('Status:', statusCode)
			console.log('Headers:', JSON.stringify(res.headers))
			res.setEncoding('utf8')
			res.on('end', () => {
				console.log('Successfully processed HTTPS response')
				resolve(statusCode)
			})
		})
		req.on('error', reject)
		req.write(JSON.stringify(postData))
		req.end()
	})
}
