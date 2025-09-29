import {
	UIResourceRenderer,
	type UIActionResult,
	isUIResource,
} from '@mcp-ui/client'
import { useState, useRef } from 'react'
import { isRouteErrorResponse } from 'react-router'
import { z } from 'zod'
import { type Route } from './+types/mcp-ui-renderer'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'MCP-UI Resource Renderer - Epic Me' },
		{
			name: 'description',
			content: 'Render MCP-UI resources with interactive messaging',
		},
	]
}

const resourceSchema = z.object({
	uri: z.string().min(1, 'URI is required'),
	mimeType: z.string().min(1, 'MIME type is required'),
	content: z.string().min(1, 'Content is required'),
	contentType: z.string().optional(),
})

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)

	const resource = resourceSchema.parse({
		uri: url.searchParams.get('uri'),
		mimeType: url.searchParams.get('mimeType'),
		content: url.searchParams.get('content'),
		contentType: url.searchParams.get('contentType'),
	})

	return { resource }
}

export default function MCPRenderer({ loaderData }: Route.ComponentProps) {
	const [messages, setMessages] = useState<
		Array<{
			id: string
			type: 'sent' | 'received' | 'response'
			content: string
			timestamp: Date
			messageId?: string
		}>
	>([])
	const messageInputRef = useRef<HTMLTextAreaElement>(null)

	const mcpResource = {
		type: 'resource' as const,
		resource: loaderData.resource,
	}

	const addMessage = (
		type: 'sent' | 'received' | 'response',
		content: string,
		messageId?: string,
	) => {
		const newMessage = {
			id: crypto.randomUUID(),
			type,
			content,
			timestamp: new Date(),
			messageId,
		}
		setMessages((prev) => [...prev, newMessage])
		return newMessage
	}

	const handleUIAction = async (result: UIActionResult) => {
		const messageId = 'messageId' in result ? result.messageId : undefined

		switch (result.type) {
			case 'tool':
				addMessage(
					'received',
					`Tool call: ${result.payload.toolName}(${JSON.stringify(result.payload.params, null, 2)})`,
					messageId,
				)
				// Simulate tool execution
				const toolResponse = {
					status: 'success',
					result: `Executed ${result.payload.toolName}`,
				}
				if (messageId) {
					// Send response back to iframe
					window.postMessage(
						{
							type: 'ui-message-response',
							messageId,
							payload: { response: toolResponse },
						},
						'*',
					)
					addMessage(
						'response',
						`Tool response: ${JSON.stringify(toolResponse, null, 2)}`,
						messageId,
					)
				}
				break
			case 'prompt':
				addMessage('received', `Prompt: ${result.payload.prompt}`, messageId)
				break
			case 'link':
				addMessage('received', `Link: ${result.payload.url}`, messageId)
				break
			case 'intent':
				addMessage(
					'received',
					`Intent: ${result.payload.intent}(${JSON.stringify(result.payload.params, null, 2)})`,
					messageId,
				)
				break
			case 'notify':
				addMessage(
					'received',
					`Notification: ${result.payload.message}`,
					messageId,
				)
				break
		}
		return { status: 'handled' }
	}

	const sendMessage = () => {
		const input = messageInputRef.current
		if (!input?.value.trim()) return

		const message = input.value.trim()
		addMessage('sent', message)
		input.value = ''

		// Send message to iframe
		window.postMessage(
			{
				type: 'ui-message-sent',
				payload: { message },
			},
			'*',
		)
	}

	const clearMessages = () => {
		setMessages([])
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
			<div className="mx-auto max-w-6xl">
				<div className="mb-8 text-center">
					<h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
						MCP-UI Resource Renderer
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-300">
						Interactive resource rendering with messaging capabilities
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					{/* Resource Renderer */}
					<div className="space-y-4">
						<div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
							<h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
								Resource: {loaderData.resource.uri}
							</h2>
							<div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700">
								<p className="text-sm text-gray-600 dark:text-gray-300">
									<strong>MIME Type:</strong> {loaderData.resource.mimeType}
								</p>
								{loaderData.resource.contentType && (
									<p className="text-sm text-gray-600 dark:text-gray-300">
										<strong>Content Type:</strong>{' '}
										{loaderData.resource.contentType}
									</p>
								)}
							</div>

							{isUIResource(mcpResource) ? (
								<div className="min-h-[400px] rounded-lg border border-gray-200 dark:border-gray-700">
									<UIResourceRenderer
										resource={mcpResource.resource}
										onUIAction={handleUIAction}
										htmlProps={{
											style: { width: '100%', height: '400px', border: 'none' },
											iframeRenderData: {
												theme: 'light',
												userId: 'demo-user',
											},
										}}
									/>
								</div>
							) : (
								<div className="flex h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
									<p className="text-gray-500 dark:text-gray-400">
										Unsupported resource type
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Messaging Interface */}
					<div className="space-y-4">
						{/* Message Input */}
						<div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
							<h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
								Send Message
							</h2>
							<div className="space-y-3">
								<textarea
									ref={messageInputRef}
									placeholder="Type your message here..."
									className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
									rows={3}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
											e.preventDefault()
											sendMessage()
										}
									}}
								/>
								<div className="flex gap-2">
									<button
										onClick={sendMessage}
										className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
									>
										Send Message
									</button>
									<button
										onClick={clearMessages}
										className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-500 dark:hover:bg-gray-600 dark:focus:ring-gray-400"
									>
										Clear Messages
									</button>
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									Press Cmd/Ctrl + Enter to send
								</p>
							</div>
						</div>

						{/* Messages Display */}
						<div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
							<h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
								Messages ({messages.length})
							</h2>
							<div className="max-h-[400px] space-y-3 overflow-y-auto">
								{messages.length === 0 ? (
									<p className="text-center text-gray-500 dark:text-gray-400">
										No messages yet
									</p>
								) : (
									messages.map((message) => (
										<div
											key={message.id}
											className={`rounded-lg p-3 ${
												message.type === 'sent'
													? 'border-l-4 border-blue-400 bg-blue-50 dark:border-blue-300 dark:bg-blue-900/20'
													: message.type === 'received'
														? 'border-l-4 border-green-400 bg-green-50 dark:border-green-300 dark:bg-green-900/20'
														: 'border-l-4 border-yellow-400 bg-yellow-50 dark:border-yellow-300 dark:bg-yellow-900/20'
											}`}
										>
											<div className="flex items-center justify-between">
												<span
													className={`text-xs font-medium ${
														message.type === 'sent'
															? 'text-blue-600 dark:text-blue-400'
															: message.type === 'received'
																? 'text-green-600 dark:text-green-400'
																: 'text-yellow-600 dark:text-yellow-400'
													}`}
												>
													{message.type.toUpperCase()}
													{message.messageId &&
														` (${message.messageId.slice(0, 8)})`}
												</span>
												<span className="text-xs text-gray-500 dark:text-gray-400">
													{message.timestamp.toLocaleTimeString()}
												</span>
											</div>
											<pre className="mt-2 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
												{message.content}
											</pre>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Resource Parameters Display */}
				<div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
					<h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
						Resource Parameters
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								URI
							</label>
							<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
								{loaderData.resource.uri}
							</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								MIME Type
							</label>
							<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
								{loaderData.resource.mimeType}
							</p>
						</div>
						{loaderData.resource.contentType && (
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Content Type
								</label>
								<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
									{loaderData.resource.contentType}
								</p>
							</div>
						)}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Content Length
							</label>
							<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
								{loaderData.resource.content.length} characters
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	if (isRouteErrorResponse(error)) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-8 dark:from-gray-900 dark:to-gray-800">
				<div className="mx-auto max-w-4xl">
					<div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
						<h1 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
							{error.status} {error.statusText}
						</h1>
						<p className="text-sm text-red-600 dark:text-red-400">
							{error.data}
						</p>
					</div>
				</div>
			</div>
		)
	} else if (error instanceof Error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-8 dark:from-gray-900 dark:to-gray-800">
				<div className="mx-auto max-w-4xl">
					<div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
						<h1 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
							Error
						</h1>
						<p className="mb-4 text-sm text-red-600 dark:text-red-400">
							{error.message}
						</p>
						<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700">
							<h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
								Required Parameters:
							</h3>
							<ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
								<li>
									•{' '}
									<code className="rounded bg-gray-200 px-1 dark:bg-gray-600">
										uri
									</code>{' '}
									- Resource URI
								</li>
								<li>
									•{' '}
									<code className="rounded bg-gray-200 px-1 dark:bg-gray-600">
										mimeType
									</code>{' '}
									- MIME type (e.g., text/html)
								</li>
								<li>
									•{' '}
									<code className="rounded bg-gray-200 px-1 dark:bg-gray-600">
										content
									</code>{' '}
									- Resource content
								</li>
								<li>
									•{' '}
									<code className="rounded bg-gray-200 px-1 dark:bg-gray-600">
										contentType
									</code>{' '}
									- Optional content type
								</li>
							</ul>
						</div>
						<details className="mt-4">
							<summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
								Stack Trace
							</summary>
							<pre className="mt-2 text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-400">
								{error.stack}
							</pre>
						</details>
					</div>
				</div>
			</div>
		)
	} else {
		return (
			<div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-8 dark:from-gray-900 dark:to-gray-800">
				<div className="mx-auto max-w-4xl">
					<div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
						<h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
							Unknown Error
						</h1>
					</div>
				</div>
			</div>
		)
	}
}
