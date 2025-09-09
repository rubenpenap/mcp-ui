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
			// 🐨 create a headers object based on the request
			// - then add the x-origin header set to the url.origin
			// - then create a new request with the headers
			// 💰 here's how you do that:
			// const headers = new Headers(request.headers)
			// headers.set('x-origin', url.origin)
			// const newRequest = new Request(request, { headers })

			return EpicMeMCP.serve('/mcp', {
				binding: 'EPIC_ME_MCP_OBJECT',
			}).fetch(
				// 🐨 pass the newRequest instead of request
				request,
				env,
				ctx,
			)
		}

		return requestHandler(request, {
			db,
			cloudflare: { env, ctx },
		})
	},
} satisfies ExportedHandler<Env>

export { EpicMeMCP }
