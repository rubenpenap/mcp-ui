import { useEffect } from 'react'

export function useMcpUiInit() {
	useEffect(() => {
		window.parent.postMessage({ type: 'ui-lifecycle-iframe-ready' }, '*')

		const height = document.documentElement.scrollHeight
		const width = document.documentElement.scrollWidth

		window.parent.postMessage(
			{ type: 'ui-size-change', payload: { height, width } },
			'*',
		)
	}, [])
}

// 🐨 export a function called sendLinkMcpMessage that takes a url string and returns a promise
// 🐨 it should:
// - generate a random UUID for the message id
// - return a new Promise((resolve, reject) = {
//	 - call window.parent.postMessage with the type 'link', the message id, and the payload { url } and targetOrigin '*'
//	 - set up a function to handle the event (MessageEvent) from the parent window
//		 - if the event.data.type is 'ui-message-response' grab the event.data's messageId and payload
//		 - if the messageId matches the message id, remove the event listener
//		 - if the payload.error exists, reject the promise with the error
//		 - otherwise resolve with the payload.response
//	 - add the "message" event listener to the window
// })
