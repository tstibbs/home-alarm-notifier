import dotenv from 'dotenv'

dotenv.config()

let {STACK_NAME} = process.env
if (STACK_NAME == null || STACK_NAME.length == 0) {
	STACK_NAME = 'Default'
}
export {STACK_NAME}
export const {IFTTT_KEY} = process.env
