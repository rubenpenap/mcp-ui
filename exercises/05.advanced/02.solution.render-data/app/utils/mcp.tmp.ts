// https://github.com/idosal/mcp-ui/issues/106
import { type z } from 'zod'

// Module-level queue for render data events
const renderDataQueue: Array<{ type: string; payload: any }> = []

// Set up global listener immediately when module loads (only in the client)
if (typeof document !== 'undefined') {
	window.addEventListener('message', (event) => {
		if (event.data?.type === 'ui-lifecycle-iframe-render-data') {
			renderDataQueue.push(event.data)
		}
	})
}

export function waitForRenderData<RenderData>(
	schema: z.ZodSchema<RenderData>,
): Promise<RenderData> {
	return new Promise((resolve, reject) => {
		// Check if we already received the data
		const queuedEvent = renderDataQueue.find(
			(event) => event.type === 'ui-lifecycle-iframe-render-data',
		)
		if (queuedEvent) {
			const result = schema.safeParse(queuedEvent.payload.renderData)
			if (!result.success) {
				console.error('Invalid render data', queuedEvent.payload.renderData)
			}
			return result.success ? resolve(result.data) : reject(result.error)
		}

		// Otherwise, set up the normal listening logic
		function cleanup() {
			window.removeEventListener('message', handleMessage)
		}

		function handleMessage(event: MessageEvent) {
			if (event.data?.type !== 'ui-lifecycle-iframe-render-data') return

			const result = schema.safeParse(event.data.payload)
			cleanup()
			if (!result.success) {
				console.error('Invalid render data', event.data.payload)
			}
			return result.success ? resolve(result.data) : reject(result.error)
		}

		window.addEventListener('message', handleMessage)
	})
}
