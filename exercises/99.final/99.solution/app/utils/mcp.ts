import { useEffect, useState } from 'react'

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
				height: height + 2,
				width: width,
			},
		},
		'*',
	)
}

function willSubmitEventFire() {
	const form = document.createElement('form')
	form.noValidate = true
	form.style.display = 'none'
	document.body.appendChild(form)

	let fired = false
	form.addEventListener(
		'submit',
		(e) => {
			fired = true
			e.preventDefault()
		},
		{ capture: true, once: true },
	)

	try {
		form.requestSubmit() // fires 'submit' synchronously if allowed
	} finally {
		form.remove()
	}

	return fired // true => submit event dispatched (forms allowed)
}

export function useFormSubmissionCapability() {
	const [canUseOnSubmit, setCanUseOnSubmit] = useState(false)

	useEffect(() => {
		const canSubmit = willSubmitEventFire()
		setCanUseOnSubmit(canSubmit)
	}, [])

	return canUseOnSubmit
}

function createMcpMessageHandler<T>(
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

export function callTool(
	toolName: string,
	params: any,
	signal?: AbortSignal,
): Promise<any> {
	return createMcpMessageHandler('tool', { toolName, params }, signal)
}

export function sendPrompt(
	prompt: string,
	signal?: AbortSignal,
): Promise<void> {
	return createMcpMessageHandler('prompt', { prompt }, signal)
}

export function navigateToLink(
	url: string,
	signal?: AbortSignal,
): Promise<void> {
	return createMcpMessageHandler('link', { url }, signal)
}
