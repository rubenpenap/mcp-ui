import { type Route } from './+types/journal-viewer.tsx'

export async function loader({ context }: Route.LoaderArgs) {
	const entries = await context.db.getEntries()
	return { entries }
}

export default function JournalViewer({ loaderData }: Route.ComponentProps) {
	const { entries } = loaderData

	return (
		<div className="bg-background max-h-[800px] overflow-y-auto p-4">
			<div className="mx-auto max-w-4xl">
				<div className="bg-card mb-6 rounded-xl border p-6 shadow-lg">
					<h1 className="text-foreground mb-2 text-3xl font-bold">
						Your Journal
					</h1>
					<p className="text-muted-foreground mb-4">
						You have {entries.length} journal{' '}
						{entries.length === 1 ? 'entry' : 'entries'}
					</p>
				</div>

				{entries.length === 0 ? (
					<div className="bg-card rounded-xl border p-8 text-center shadow-lg">
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
								className="bg-card rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
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
