import { type DBClient } from '@epic-web/epicme-db-client'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
	SetLevelRequestSchema,
	type LoggingLevel,
} from '@modelcontextprotocol/sdk/types.js'
import { McpAgent } from 'agents/mcp'
import { db } from '../db.ts'
import { initializePrompts } from './prompts.ts'
import { initializeResources } from './resources.ts'
import { initializeTools } from './tools.ts'
import { getJournalViewUI } from './ui.ts'

type Props = { baseUrl: string }
type State = { loggingLevel: LoggingLevel }

export class EpicMeMCP extends McpAgent<Env, State, Props> {
	db!: DBClient
	initialState: State = { loggingLevel: 'info' }
	server = new McpServer(
		{
			name: 'epicme',
			title: 'EpicMe Journal',
			version: '1.0.0',
		},
		{
			capabilities: {
				tools: { listChanged: true },
				resources: { listChanged: true, subscribe: true },
				completions: {},
				logging: {},
				prompts: { listChanged: true },
			},
			instructions: `
EpicMe is a journaling app that allows users to write about and review their experiences, thoughts, and reflections.

These tools are the user's window into their journal. With these tools and your help, they can create, read, and manage their journal entries and associated tags.

You can also help users add tags to their entries and get all tags for an entry.
			`.trim(),
		},
	)

	async init() {
		this.db = db
		this.server.server.setRequestHandler(
			SetLevelRequestSchema,
			async (request) => {
				this.setState({ ...this.state, loggingLevel: request.params.level })
				return {}
			},
		)
		await initializeTools(this)
		await initializeResources(this)
		await initializePrompts(this)
	}
}

export default {
	fetch: async (request, env, ctx) => {
		const url = new URL(request.url)

		if (url.pathname === '/mcp') {
			ctx.props.baseUrl = url.origin
			const mcp = EpicMeMCP.serve('/mcp', {
				binding: 'EPIC_ME_MCP_OBJECT',
			})
			return mcp.fetch(request, env, ctx)
		}

		if (url.pathname === '/journal') {
			const ui = await getJournalViewUI(db)
			return new Response(ui, {
				headers: { 'Content-Type': 'text/html' },
			})
		}

		return new Response('Not found', { status: 404 })
	},
} satisfies ExportedHandler<Env>
