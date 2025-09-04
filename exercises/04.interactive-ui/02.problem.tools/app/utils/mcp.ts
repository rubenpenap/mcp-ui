import { useEffect } from 'react'
import { type z } from 'zod'

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
		{ type: 'ui-size-change', payload: { height, width } },
		'*',
	)
}

type MessageOptions = {
	schema?: z.ZodSchema
	signal?: AbortSignal
}

type McpMessageReturnType<Options> = Promise<
	Options extends { schema: z.ZodSchema } ? z.infer<Options['schema']> : unknown
>

type McpMessageTypes = {
	tool: { toolName: string; params: Record<string, unknown> }
	link: { url: string }
}

type McpMessageType = keyof McpMessageTypes

function sendMcpMessage<Options extends MessageOptions>(
	type: 'link',
	payload: McpMessageTypes['link'],
	options?: Options,
): McpMessageReturnType<Options>

function sendMcpMessage(
	type: McpMessageType,
	payload: McpMessageTypes[McpMessageType],
	options: MessageOptions = {},
): McpMessageReturnType<typeof options> {
	const { signal, schema } = options
	const messageId = crypto.randomUUID()

	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new Error('Operation aborted before it began'))
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

					if (error) return reject(new Error(error))

					if (!schema) return resolve(response)

					const parseResult = schema.safeParse(response)
					if (!parseResult.success) {
						return reject(new Error(parseResult.error.message))
					}
					return resolve(parseResult.data)
				}
			}
		}

		window.addEventListener('message', handleMessage, { signal })
	})
}

export { sendMcpMessage }
