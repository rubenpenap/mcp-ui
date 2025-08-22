import { invariant } from '@epic-web/invariant'
import { useTransition } from 'react'
import {
	ErrorBoundary,
	useErrorBoundary,
	type FallbackProps,
} from 'react-error-boundary'
import { useRevalidator } from 'react-router'
import { z } from 'zod'
import {
	useMcpUiInit,
	navigateToLink,
	callTool,
	sendPrompt,
} from '#app/utils/mcp.ts'
import { useDoubleCheck } from '#app/utils/misc.ts'
import { type Route } from './+types/journal-viewer.tsx'

export async function loader({ context }: Route.LoaderArgs) {
	const entries = await context.db.getEntries()
	return { entries }
}

export default function JournalViewer({ loaderData }: Route.ComponentProps) {
	const { entries } = loaderData

	useMcpUiInit()

	return (
		<div className="bg-background max-h-[800px] overflow-y-auto p-4">
			<div className="mx-auto max-w-4xl">
				<div className="bg-card mb-6 rounded-xl p-6 shadow-lg">
					<h1 className="text-foreground mb-2 text-3xl font-bold">
						Your Journal
					</h1>
					<p className="text-muted-foreground mb-4">
						You have {entries.length} journal{' '}
						{entries.length === 1 ? 'entry' : 'entries'}
					</p>
					<XPostLink entryCount={entries.length} />
				</div>

				{entries.length === 0 ? (
					<div className="bg-card rounded-xl p-8 text-center shadow-lg">
						<div
							className="mb-4 text-6xl"
							role="img"
							aria-label="Empty journal"
						>
							📝
						</div>
						<h2 className="text-foreground mb-2 text-xl font-semibold">
							No Journal Entries Yet
						</h2>
						<p className="text-muted-foreground">
							Start writing your thoughts and experiences to see them here.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{entries.map((entry) => (
							<div
								key={entry.id}
								className="bg-card border-border rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="mb-3 flex items-center gap-3">
											<h3 className="text-foreground text-lg font-semibold">
												{entry.title}
											</h3>
										</div>

										<div className="mb-3 flex flex-wrap gap-2">
											<span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-sm">
												🏷️ {entry.tagCount} tag{entry.tagCount !== 1 ? 's' : ''}
											</span>
										</div>

										<div className="mt-4 flex gap-2">
											<button className="text-primary text-sm font-medium hover:underline">
												View Details
											</button>
											<SummarizeEntryButton entry={entry} />
											<DeleteEntryButton entry={entry} />
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

function XPostLink({ entryCount }: { entryCount: number }) {
	return (
		<ErrorBoundary FallbackComponent={XPostLinkError}>
			<XPostLinkImpl entryCount={entryCount} />
		</ErrorBoundary>
	)
}

function XPostLinkError({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3">
			<p className="text-sm font-medium">Failed to post on X</p>
			<p className="text-destructive/80 text-xs">{error.message}</p>
			<button
				onClick={resetErrorBoundary}
				className="text-destructive mt-2 cursor-pointer text-xs hover:underline"
			>
				Try again
			</button>
		</div>
	)
}

function XPostLinkImpl({ entryCount }: { entryCount: number }) {
	const [isPending, startTransition] = useTransition()
	const { showBoundary } = useErrorBoundary()
	const handlePostOnX = () => {
		startTransition(async () => {
			try {
				const text = `I have ${entryCount} journal ${entryCount === 1 ? 'entry' : 'entries'} in my EpicMe journal! 📝✨`
				const url = new URL('https://x.com/intent/post')
				url.searchParams.set('text', text)

				await navigateToLink(url.toString())
			} catch (err) {
				showBoundary(err)
			}
		})
	}

	return (
		<button
			onClick={handlePostOnX}
			disabled={isPending}
			className="flex cursor-pointer items-center gap-2 rounded-lg bg-black px-4 py-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
		>
			<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
			</svg>
			{isPending ? 'Posting...' : 'Post'}
		</button>
	)
}

function DeleteEntryButton({
	entry,
}: {
	entry: { id: number; title: string }
}) {
	return (
		<ErrorBoundary FallbackComponent={DeleteEntryError}>
			<DeleteEntryButtonImpl entry={entry} />
		</ErrorBoundary>
	)
}

function DeleteEntryError({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3">
			<p className="text-sm font-medium">Failed to delete entry</p>
			<p className="text-destructive/80 text-xs">{error.message}</p>
			<button
				onClick={resetErrorBoundary}
				className="text-destructive mt-2 cursor-pointer text-xs hover:underline"
			>
				Try again
			</button>
		</div>
	)
}

function DeleteEntryButtonImpl({
	entry,
}: {
	entry: { id: number; title: string }
}) {
	const [isPending, startTransition] = useTransition()
	const { doubleCheck, getButtonProps } = useDoubleCheck()
	const { showBoundary } = useErrorBoundary()
	const revalidator = useRevalidator()

	const handleDelete = () => {
		startTransition(async () => {
			try {
				await callTool('delete_entry', { id: entry.id })
				await revalidator.revalidate()
			} catch (err) {
				showBoundary(err)
			}
		})
	}

	return (
		<button
			{...getButtonProps({
				onClick: doubleCheck ? handleDelete : undefined,
				disabled: isPending,
				className: `text-sm font-medium px-3 py-1.5 rounded-md border transition-colors ${
					doubleCheck
						? 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90'
						: 'text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40'
				} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`,
			})}
		>
			{isPending ? 'Deleting...' : doubleCheck ? `Confirm?` : 'Delete'}
		</button>
	)
}

function SummarizeEntryButton({
	entry,
}: {
	entry: { id: number; title: string }
}) {
	return (
		<ErrorBoundary FallbackComponent={SummarizeEntryError}>
			<SummarizeEntryButtonImpl entry={entry} />
		</ErrorBoundary>
	)
}

function SummarizeEntryError({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3">
			<p className="text-sm font-medium">Failed to summarize entry</p>
			<p className="text-destructive/80 text-xs">{error.message}</p>
			<button
				onClick={resetErrorBoundary}
				className="text-destructive mt-2 cursor-pointer text-xs hover:underline"
			>
				Try again
			</button>
		</div>
	)
}

function SummarizeEntryButtonImpl({
	entry,
}: {
	entry: { id: number; title: string }
}) {
	const [isPending, startTransition] = useTransition()
	const { showBoundary } = useErrorBoundary()

	const handleSummarize = () => {
		startTransition(async () => {
			try {
				// Get the full entry content first
				const fullEntry = await callTool('get_entry', { id: entry.id })
				console.log({ fullEntry })
				invariant(fullEntry, 'Failed to retrieve entry content')
				const entrySchema = z.object({
					title: z.string(),
					content: z.string(),
					mood: z.string().optional(),
					location: z.string().optional(),
					weather: z.string().optional(),
					tags: z
						.array(z.object({ id: z.number(), name: z.string() }))
						.optional(),
				})
				const parsedEntry = entrySchema.parse(fullEntry)

				// Create a prompt requesting a summary
				const prompt = `Please provide a concise summary of this journal entry:

Title: ${parsedEntry.title}
Content: ${parsedEntry.content}
Mood: ${parsedEntry.mood || 'Not specified'}
Location: ${parsedEntry.location || 'Not specified'}
Weather: ${parsedEntry.weather || 'Not specified'}
Tags: ${parsedEntry.tags?.map((t: { name: string }) => t.name).join(', ') || 'None'}

Please provide a brief, insightful summary of this entry.`

				await sendPrompt(prompt)
			} catch (err) {
				showBoundary(err)
			}
		})
	}

	return (
		<button
			onClick={handleSummarize}
			disabled={isPending}
			className="text-primary text-sm font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isPending ? 'Summarizing...' : 'Summarize'}
		</button>
	)
}
