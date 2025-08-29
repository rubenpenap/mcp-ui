import { EpicMeMCP } from './mcp/index.ts'

export default {
	fetch: async (request, env, ctx) => {
		const url = new URL(request.url)
		if (url.pathname === '/mcp') {
			return EpicMeMCP.serve('/mcp', {
				binding: 'EPIC_ME_MCP_OBJECT',
			}).fetch(request, env, ctx)
		}

		return new Response('Not found', { status: 404 })
	},
} satisfies ExportedHandler<Env>

export { EpicMeMCP }
