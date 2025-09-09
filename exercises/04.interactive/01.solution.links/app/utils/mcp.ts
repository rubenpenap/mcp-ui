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

export function sendLinkMcpMessage(url: string) {
	const messageId = crypto.randomUUID()

	return new Promise((resolve, reject) => {
		window.parent.postMessage(
			{ type: 'link', messageId, payload: { url } },
			'*',
		)

		function handleMessage(event: MessageEvent) {
			if (event.data.type === 'ui-message-response') {
				const {
					messageId: responseMessageId,
					payload: { response, error },
				} = event.data
				if (responseMessageId === messageId) {
					window.removeEventListener('message', handleMessage)

					if (error) {
						reject(new Error(error))
					} else {
						resolve(response)
					}
				}
			}
		}

		window.addEventListener('message', handleMessage)
	})
}
