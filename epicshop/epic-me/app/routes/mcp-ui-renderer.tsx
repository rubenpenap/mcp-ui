import { invariantResponse } from '@epic-web/invariant'
import {
	UIResourceRenderer,
	type UIActionResult,
	isUIResource,
} from '@mcp-ui/client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Form, isRouteErrorResponse } from 'react-router'
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

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const resourceData = url.searchParams.get('resourceData')

	invariantResponse(resourceData, 'resourceData search param is required')

	const resource = JSON.parse(resourceData)
	const content = { type: 'resource', resource }

	if (!isUIResource(content)) {
		throw new Error(
			`resourceData param must be a UI resource. Instead it is: ${resourceData}`,
		)
	}

	return { content }
}

function useAutoScroll() {
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const [isAtBottom, setIsAtBottom] = useState(true)

	const scrollToBottom = useCallback(() => {
		const container = messagesEndRef.current?.parentElement
		if (!container) return

		container.scrollTo({
			top: container.scrollHeight,
			behavior: 'smooth',
		})
	}, [])

	const checkIfAtBottom = useCallback(() => {
		const container = messagesEndRef.current?.parentElement
		if (!container) return

		const threshold = 5 // pixels from bottom
		const isAtBottom =
			container.scrollTop + container.clientHeight >=
			container.scrollHeight - threshold

		setIsAtBottom(isAtBottom)
	}, [])

	useEffect(() => {
		const container = messagesEndRef.current?.parentElement
		if (!container) return

		container.addEventListener('scroll', checkIfAtBottom)
		return () => container.removeEventListener('scroll', checkIfAtBottom)
	}, [checkIfAtBottom])

	return {
		messagesEndRef,
		isAtBottom,
		scrollToBottom,
	}
}

export default function MCPRenderer({ loaderData }: Route.ComponentProps) {
	const { content } = loaderData
	const { messagesEndRef, isAtBottom, scrollToBottom } = useAutoScroll()
	const [messages, setMessages] = useState<
		Array<{
			id: string
			type: 'sent' | 'received' | 'response'
			content: string
			timestamp: Date
			messageId?: string
			respondsTo?: string
		}>
	>([])
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
		null,
	)
	const pendingPromisesRef = useRef<
		Map<
			string,
			{
				resolve: (value: any) => void
				reject: (error: any) => void
			}
		>
	>(new Map())
	const messageInputRef = useRef<HTMLTextAreaElement>(null)
	const [isErrorResponse, setIsErrorResponse] = useState<boolean>(false)

	// Auto-scroll when new messages are added and user is at bottom
	useEffect(() => {
		if (isAtBottom) {
			scrollToBottom()
		}
	}, [messages, isAtBottom, scrollToBottom])

	const addMessage = (
		type: 'sent' | 'received' | 'response',
		content: string,
		messageId?: string,
		respondsTo?: string,
	) => {
		const newMessage = {
			id: crypto.randomUUID(),
			type,
			content,
			timestamp: new Date(),
			messageId,
			respondsTo,
		}
		setMessages((prev) => [...prev, newMessage])
		// Track the most recent messageId for responses
		if (messageId) {
			setSelectedMessageId(messageId)
		}
		return newMessage
	}

	const handleUIAction = async (result: UIActionResult) => {
		const messageId = 'messageId' in result ? result.messageId : undefined

		const fullResult = JSON.stringify(result, null, 2)
		console.log('Full UIActionResult:', fullResult)
		addMessage('received', fullResult, messageId)

		// Return a promise that will be resolved when user submits response
		return new Promise((resolve, reject) => {
			if (messageId) {
				pendingPromisesRef.current.set(messageId, { resolve, reject })
			}
		})
	}

	const sendMessage = () => {
		const input = messageInputRef.current
		if (!input) return

		const message = input.value.trim()

		// Resolve the pending promise with the user's input
		if (
			selectedMessageId &&
			pendingPromisesRef.current.has(selectedMessageId)
		) {
			const promise = pendingPromisesRef.current.get(selectedMessageId)!
			if (isErrorResponse) {
				promise.reject(message)
			} else {
				promise.resolve(message)
			}
			pendingPromisesRef.current.delete(selectedMessageId)
		}

		addMessage('sent', message, undefined, selectedMessageId || undefined)
		input.value = ''
		setIsErrorResponse(false)
		setSelectedMessageId(null)
	}

	const clearMessages = () => {
		setMessages([])
	}

	const needsResponse = (messageId?: string) => {
		return messageId && pendingPromisesRef.current.has(messageId)
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
								Resource: {content.resource.uri}
							</h2>
							<div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700">
								<p className="text-sm text-gray-600 dark:text-gray-300">
									<strong>MIME Type:</strong> {content.resource.mimeType}
								</p>
								{content.resource.contentType && (
									<p className="text-sm text-gray-600 dark:text-gray-300">
										<strong>Content Type:</strong>{' '}
										{content.resource.contentType}
									</p>
								)}
							</div>

							{isUIResource(content) ? (
								<div className="min-h-[600px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
									<UIResourceRenderer
										resource={content.resource}
										onUIAction={handleUIAction}
										htmlProps={{
											style: {
												width: '100%',
												height: '600px',
												border: 'none',
												borderRadius: '0.5rem',
											},
											iframeRenderData: {
												theme: 'light',
												userId: 'demo-user',
											},
										}}
									/>
								</div>
							) : (
								<div className="flex h-[600px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
									<p className="text-gray-500 dark:text-gray-400">
										Unsupported resource type
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Chat Interface */}
					<div className="flex flex-col">
						<div className="flex flex-1 flex-col rounded-xl bg-white shadow-lg dark:bg-gray-800">
							{/* Chat Header */}
							<div className="border-b border-gray-200 p-4 dark:border-gray-700">
								<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
									Messages ({messages.length})
								</h2>
							</div>

							{/* Messages Area */}
							<div className="flex max-h-[680px] flex-1 flex-col">
								<div className="flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4">
									{messages.length === 0 ? (
										<div className="flex h-full items-center justify-center">
											<p className="text-center text-gray-500 dark:text-gray-400">
												No messages yet. Start a conversation!
											</p>
										</div>
									) : (
										messages.map((message) => (
											<div
												key={message.id}
												className={`flex gap-1 ${
													message.type === 'sent'
														? 'justify-end'
														: 'justify-start'
												}`}
											>
												<div
													className={`max-w-[80%] rounded-lg px-4 py-2 ${
														message.type === 'sent'
															? 'bg-blue-600 text-white'
															: message.type === 'received'
																? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
																: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100'
													}`}
												>
													<div className="mb-1 flex items-center justify-between gap-1">
														<div className="flex items-center gap-2">
															<span
																className={`text-xs font-medium ${
																	message.type === 'sent'
																		? 'text-blue-100'
																		: message.type === 'received'
																			? 'text-gray-500 dark:text-gray-400'
																			: 'text-yellow-600 dark:text-yellow-400'
																}`}
															>
																<MessageTypeLabel
																	type={message.type}
																	content={message.content}
																	messageId={message.messageId}
																/>
																{message.respondsTo && (
																	<span className="ml-1 text-xs opacity-75">
																		↳ {message.respondsTo.slice(0, 8)}
																	</span>
																)}
															</span>
															{needsResponse(message.messageId) && (
																<button
																	onClick={() =>
																		setSelectedMessageId(
																			selectedMessageId === message.messageId
																				? null
																				: message.messageId!,
																		)
																	}
																	className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
																		selectedMessageId === message.messageId
																			? 'bg-orange-500 text-white'
																			: 'bg-orange-200 text-orange-800 hover:bg-orange-300 dark:bg-orange-800 dark:text-orange-200 dark:hover:bg-orange-700'
																	}`}
																>
																	{selectedMessageId === message.messageId
																		? 'Selected'
																		: 'Respond'}
																</button>
															)}
														</div>
														<span
															className={`text-xs ${
																message.type === 'sent'
																	? 'text-blue-100'
																	: 'text-gray-500 dark:text-gray-400'
															}`}
														>
															{message.timestamp.toLocaleTimeString()}
														</span>
													</div>
													<div className="overflow-x-auto font-mono text-sm whitespace-pre-wrap">
														{message.content}
													</div>
												</div>
											</div>
										))
									)}
									{/* Scroll anchor for auto-scroll */}
									<div ref={messagesEndRef} />
								</div>

								{/* Message Input Area */}
								<div className="border-t border-gray-200 p-4 dark:border-gray-700">
									{selectedMessageId && (
										<div className="mb-3 rounded-md bg-orange-50 p-2 dark:bg-orange-900/20">
											<p className="text-xs text-orange-800 dark:text-orange-200">
												Responding to message: {selectedMessageId.slice(0, 8)}
											</p>
										</div>
									)}
									<div className="flex gap-2">
										<textarea
											ref={messageInputRef}
											placeholder="Type your message here..."
											className={`flex-1 rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none dark:bg-gray-700 dark:text-white`}
											rows={6}
											onKeyDown={(e) => {
												if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
													e.preventDefault()
													sendMessage()
												}
											}}
										/>
										<button
											onClick={sendMessage}
											className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
										>
											Send
										</button>
									</div>
									<div className="mt-2 flex items-center gap-2">
										{selectedMessageId && (
											<label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
												<input
													type="checkbox"
													checked={isErrorResponse}
													onChange={(e) => setIsErrorResponse(e.target.checked)}
													className="rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700"
												/>
												Error Response
											</label>
										)}
										<button
											onClick={clearMessages}
											className="rounded-md bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-500 dark:hover:bg-gray-600 dark:focus:ring-gray-400"
										>
											Clear
										</button>
									</div>
									<div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
										Press Cmd/Ctrl + Enter to send
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Edit contentData JSON in URL */}
				<Form
					method="GET"
					className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
				>
					<h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
						Edit contentData JSON
					</h2>
					<textarea
						name="contentData"
						className="w-full rounded border border-gray-300 bg-gray-50 p-2 font-mono text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						rows={10}
						defaultValue={JSON.stringify(content, null, 2)}
					/>
					<button
						type="submit"
						className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						Update contentData
					</button>
				</Form>
			</div>
		</div>
	)
}

const ACTION_EMOJIS = {
	tool: '🔧',
	prompt: '💬',
	link: '🔗',
	intent: '🎯',
	notify: '🔔',
} as const

function MessageTypeLabel({
	type,
	content,
	messageId,
}: {
	type: string
	content: string
	messageId?: string
}) {
	if (type === 'received' && content.includes('"type":')) {
		try {
			const parsed = JSON.parse(content)
			const emoji =
				ACTION_EMOJIS[parsed.type as keyof typeof ACTION_EMOJIS] || '📨'
			return (
				<>
					{emoji} {type.toUpperCase()}
					{messageId && ` (${messageId.slice(0, 8)})`}
				</>
			)
		} catch {
			return (
				<>
					{type.toUpperCase()}
					{messageId && ` (${messageId.slice(0, 8)})`}
				</>
			)
		}
	}

	return (
		<>
			{type.toUpperCase()}
			{messageId && ` (${messageId.slice(0, 8)})`}
		</>
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
