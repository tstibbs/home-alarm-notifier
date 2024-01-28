import util from 'util'
import {exec as nodeExec} from 'child_process'
import axios from 'axios'

import {INCOMING_TOPIC_NAME, RESPONSE_TOPIC_NAME} from './constants.js'
import {buildIotClient} from '@tstibbs/cloud-core-edge-utils'

const exec = util.promisify(nodeExec)
const devicePings = process.env.DEVICES.split(',')
const topics = [INCOMING_TOPIC_NAME]
const haWebhook = process.env.HA_WEBHOOK

class App {
	#client

	#init() {
		//just so that the client doesn't get created when simply instantiating the class in tests
		this.#client = buildIotClient(topics, () => {
			this.#processEvent()
		})
	}

	startListeningForCommands() {
		this.#init()
		//just to keep it running and listening:
		setInterval(() => {}, 15.5 * 24 * 60 * 60 * 1000) //can't be over max int, and using a number of days that doesn't divide by 7 means that it will be at a different time/day
	}

	async #wait(time) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve()
			}, time)
		})
	}

	async #processEvent() {
		console.log(`date=${new Date()}`)
		//no point pinging straight away, as if the devices aren't there we will wait a bit to see if they connect anyway
		//so might as well just wait until the max time before trying to all
		await this.#wait(5000)
		await this.#checkDevices()
	}

	async testCheckDevices() {
		this.#init()
		await this.#checkDevices()
	}

	async #checkDevices() {
		let pings = await Promise.all(devicePings.map(this.#isAccessible))
		console.log(devicePings)
		console.log(pings)
		let success = pings.includes(true)
		console.log(`Ping success=${success} - ${new Date()}`)
		if (!success) {
			axios.post(
				haWebhook,
				{
					title: 'Alarm Disarmed',
					message: 'home owner ' + (success ? 'was' : 'not') + ' present'
				},
				{
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
			// this.#client.publish(
			// 	RESPONSE_TOPIC_NAME,
			// 	JSON.stringify({
			// 		event: 'disarmed',
			// 		situation: 'home owner ' + (success ? 'was' : 'not') + ' present'
			// 	})
			// )
		}
	}

	async #isAccessible(devicePing) {
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
}

export {App}
