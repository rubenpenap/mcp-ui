import { invariant } from '@epic-web/invariant'
import { Client } from '@modelcontextprotocol/sdk/client'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { chromium } from 'playwright'
import { test, expect, inject } from 'vitest'
import { z } from 'zod'

const mcpServerPort = inject('mcpServerPort')

async function setupBrowser() {
	const browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	return {
		browser,
		page,
		async [Symbol.asyncDispose]() {
			await browser.close()
		},
	}
}

async function setupClient() {
	const client = new Client(
		{
			name: 'EpicMeTester',
			version: '1.0.0',
		},
		{ capabilities: {} },
	)

	const transport = new StreamableHTTPClientTransport(
		new URL(`http://localhost:${mcpServerPort}/mcp`),
	)

	await client.connect(transport)

	return {
		client,
		async [Symbol.asyncDispose]() {
			await client.transport?.close()
		},
	}
}

test('journal viewer sends ui-lifecycle-iframe-ready message', async () => {
	await using setup = await setupClient()
	const { client } = setup

	const result = await client.callTool({ name: 'view_journal' }).catch((e) => {
		throw new Error('🚨 view_journal tool call failed', { cause: e })
	})

	invariant(Array.isArray(result.content), '🚨 content is not an array')

	const { resource } = z
		.object({ resource: z.object({ text: z.string() }) })
		.parse(result.content[0])

	const urlString = resource.text

	await using browserSetup = await setupBrowser()
	const { page } = browserSetup

	await page.addInitScript(() => {
		// one per document; created before app code runs
		window.__uiReadyDeferred = new Promise((resolve) => {
			window.__resolveUiReady = resolve
		})

		window.addEventListener('message', (event: MessageEvent) => {
			if (event?.data?.type === 'ui-lifecycle-iframe-ready') {
				window.__resolveUiReady?.(event.data)
			}
		})
	})

	await page.goto(urlString)

	const message = await Promise.race([
		page.evaluate(() => {
			return window.__uiReadyDeferred
		}),
		new Promise((r, reject) =>
			setTimeout(() => reject('🚨 timed out waiting for message'), 3000),
		),
	])

	invariant(
		typeof message === 'object' && message !== null,
		'🚨 message not received',
	)

	const parsedMessage = z
		.object({
			type: z.string(),
		})
		.parse(message)

	expect(
		parsedMessage.type,
		'🚨 message type is not ui-lifecycle-iframe-ready',
	).toBe('ui-lifecycle-iframe-ready')
})

declare global {
	interface Window {
		__uiReadyDeferred?: Promise<{
			type: string
		}>
		__resolveUiReady?: (data: { type: string }) => void
		addEventListener(
			type: string,
			listener: (event: MessageEvent) => void,
			options?: { once?: boolean },
		): void
	}

	var window: Window & typeof globalThis
}
