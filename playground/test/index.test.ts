import { invariant } from '@epic-web/invariant'
import { Client } from '@modelcontextprotocol/sdk/client'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { chromium, type Page } from 'playwright'
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

test('journal viewer sends ui-size-change message', async () => {
	await using setup = await setupClient()
	const { client } = setup

	const result = await client.callTool({ name: 'view_journal' }).catch((e) => {
		throw new Error('🚨 view_journal tool call failed', { cause: e })
	})

	invariant(Array.isArray(result.content), '🚨 content is not an array')

	const { resource } = z
		.object({ resource: z.object({}).passthrough() })
		.parse(result.content[0])

	const url = new URL('http://localhost:7787/mcp-ui-renderer')
	url.searchParams.set('resourceData', JSON.stringify(resource))

	await using browserSetup = await setupBrowser()
	const { page } = browserSetup

	await handleViteDeps(page)

	await page.goto(url.toString())
	const message = page.getByRole('log').getByText('ui-size-change')
	await message.waitFor({ timeout: 1000 }).catch((e) => {
		throw new Error(
			'🚨 ui-size-change was never received. Make sure to call postMessage with "ui-size-change" with width and height and the target set to "*".',
			{ cause: e },
		)
	})

	const textContent = await message.textContent()
	const messageContent = JSON.parse(textContent!)
	expect(
		messageContent,
		'🚨 the ui-size-change message is not the correct format',
	).toEqual({
		type: 'ui-size-change',
		payload: {
			height: expect.any(Number),
			width: expect.any(Number),
		},
	})
})

// because vite needs to optimize deps 😭😡
async function handleViteDeps(page: Page) {
	await page
		.frameLocator('iframe')
		.locator('vite-error-overlay')
		.waitFor({ timeout: 200 })
		.then(
			async () => {
				await page.reload()
				await new Promise((resolve) => setTimeout(resolve, 400))
			},
			() => {
				// good...
			},
		)
}
