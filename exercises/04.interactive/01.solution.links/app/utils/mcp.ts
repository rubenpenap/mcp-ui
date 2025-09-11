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
			if (event.data.type !== 'ui-message-response') return
			if (event.data.messageId !== messageId) return
			window.removeEventListener('message', handleMessage)

			const { response, error } = event.data.payload
			return error ? reject(error) : resolve(response)
		}

		window.addEventListener('message', handleMessage)
	})
}
