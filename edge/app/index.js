import {startListeningForCommands, checkDevices} from './app.js'

console.log(`Running... ${new Date()}`);

var args = process.argv.slice(2);
if (args.length == 0) {
	startListeningForCommands()
} else if (args.length == 1 && args[0] == 'test') {
	checkDevices()
} else {
	throw new Error(`Unsupported args (did you mean 'test'?): ${JSON.stringify(args)}`)
}
