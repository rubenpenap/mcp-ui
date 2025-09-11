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
			ctx.props.baseUrl = url.origin

			return EpicMeMCP.serve('/mcp', {
				binding: 'EPIC_ME_MCP_OBJECT',
			}).fetch(request, env, ctx)
		}

		return requestHandler(request, {
			db,
			cloudflare: { env, ctx },
		})
	},
} satisfies ExportedHandler<Env>

export { EpicMeMCP }
