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

test('view_journal sends iframe response', async () => {
	await using setup = await setupClient()
	const { client } = setup

	const result = await client.callTool({ name: 'view_journal' }).catch((e) => {
		throw new Error('🚨 view_journal tool call failed', { cause: e })
	})

	const content = z.array(z.object({}).passthrough()).parse(result.content)

	expect(
		content,
		'🚨 content returned from view_journal tool does not match the expected format',
	).toEqual([
		{
			type: 'resource',
			resource: {
				uri: expect.stringMatching(/^ui:\/\/view-journal\/\d+$/),
				mimeType: 'text/uri-list',
				text: `http://localhost:${mcpServerPort}/ui/journal-viewer`,
			},
		},
	])
	const { resource } = z
		.object({ resource: z.object({ text: z.string() }) })
		.parse(content[0])

	const urlString = resource.text

	await using browserSetup = await setupBrowser()
	const { page } = browserSetup
	await page.goto(urlString)

	const readyMessage = Promise.race([
		page.evaluate(() => {
			return new Promise<{ type: string }>((resolve) => {
				// @ts-expect-error - window is defined in this context
				window.addEventListener(
					'message',
					(event: MessageEvent) => {
						if (event.data?.type === 'ui-lifecycle-iframe-ready') {
							resolve(event.data)
						}
					},
					{ once: true },
				)
			})
		}),
		new Promise((r, reject) => {
			setTimeout(() => reject('🚨 iframe ready message not received'), 500)
		}),
	])

	expect(await readyMessage).toEqual({ type: 'ui-lifecycle-iframe-ready' })
})
