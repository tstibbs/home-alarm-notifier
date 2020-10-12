const assert = require('assert')

const {incomingTriggerHandler, notificationHandler} = require('../dist/main.js')

assert.strictEqual(typeof incomingTriggerHandler, "function")
assert.strictEqual(typeof notificationHandler, "function")
