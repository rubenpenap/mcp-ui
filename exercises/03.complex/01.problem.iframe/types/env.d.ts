// ensure the module is in the program so the merge hits
import { type DBClient } from '@epic-web/epicme-db-client'
import 'cloudflare:workers'

interface EpicExecutionContext extends ExecutionContext {
	props: {
		baseUrl: string
	}
}

declare module 'react-router' {
	export interface AppLoadContext {
		db: DBClient
		cloudflare: {
			env: Env
			ctx: EpicExecutionContext
		}
	}
}
