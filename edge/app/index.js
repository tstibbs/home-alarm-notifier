import {App} from './app.js'

console.log(`Running... ${new Date()}`)
const app = new App()

var args = process.argv.slice(2)
if (args.length == 0) {
	app.startListeningForCommands()
} else if (args.length == 1 && args[0] == 'test') {
	app.checkDevices()
} else {
	throw new Error(`Unsupported args (did you mean 'test'?): ${JSON.stringify(args)}`)
}
