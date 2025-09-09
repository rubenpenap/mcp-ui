import { createRequestHandler } from 'react-router'
import { db } from './db.ts'
import { EpicMeMCP } from './mcp/index.ts'

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
)

export default {
	fetch: async (request, env, ctx) => {
		const url = new URL(request.url)

		if (url.pathname === '/mcp') {
			const headers = new Headers(request.headers)
			headers.set('x-origin', url.origin)
			const newRequest = new Request(request, { headers })

			return EpicMeMCP.serve('/mcp', {
				binding: 'EPIC_ME_MCP_OBJECT',
			}).fetch(newRequest, env, ctx)
		}

		return requestHandler(request, {
			db,
			cloudflare: { env, ctx },
		})
	},
} satisfies ExportedHandler<Env>

export { EpicMeMCP }
