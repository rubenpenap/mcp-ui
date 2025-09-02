import { useEffect } from 'react'

export function useMcpUiInit() {
	useEffect(() => {
		window.parent.postMessage({ type: 'ui-lifecycle-iframe-ready' }, '*')

		requestAnimationFrame(() => {
			notifyParentOfCurrentDocumentSize()
		})
	}, [])
}

export function notifyParentOfCurrentDocumentSize() {
	const height = document.documentElement.scrollHeight
	const width = document.documentElement.scrollWidth

	window.parent.postMessage(
		{
			type: 'ui-size-change',
			payload: {
				height: height,
				width: width,
			},
		},
		'*',
	)
}

function createMcpMessageHandler<T extends unknown>(
	type: string,
	payload: Record<string, unknown>,
	signal?: AbortSignal,
): Promise<T> {
	const messageId = crypto.randomUUID()

	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new Error('Operation aborted'))
			return
		}

		if (!window.parent || window.parent === window) {
			console.log(`[MCP] No parent frame available. Would have sent message:`, {
				type,
				messageId,
				payload,
			})
			reject(new Error('No parent frame available'))
			return
		}

		window.parent.postMessage({ type, messageId, payload }, '*')

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

		window.addEventListener('message', handleMessage, { signal })
	})
}

export function callTool<ReturnType extends unknown>(
	toolName: string,
	params: any,
	signal?: AbortSignal,
): Promise<ReturnType> {
	// Temporarily send a prompt instead of tool message since MCP tool messages don't work in Goose yet
	const prompt = `Please call the tool "${toolName}" with the following parameters: ${JSON.stringify(params, null, 2)}`
	return createMcpMessageHandler('prompt', { prompt }, signal)
	// return createMcpMessageHandler('tool', { toolName, params }, signal)
}

export function sendPrompt<ReturnType extends unknown>(
	prompt: string,
	signal?: AbortSignal,
): Promise<ReturnType> {
	return createMcpMessageHandler('prompt', { prompt }, signal)
}

export function navigateToLink<ReturnType extends unknown>(
	url: string,
	signal?: AbortSignal,
): Promise<ReturnType> {
	return createMcpMessageHandler('link', { url }, signal)
}
