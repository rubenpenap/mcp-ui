import { type DBClient } from '@epic-web/epicme-db-client'

export async function getJournalViewUI(db: DBClient) {
	const entries = await db.getEntries()
	return /* html */ `
<html>
	${getHead()}
	<body>
		<div class="container">
			<h1 class="title">Epic Me</h1>
			<div class="entries-grid">
				${entries.map((entry) => createEntryCard(entry)).join('')}
			</div>
		</div>
</html>
	`
}

export async function getEntryViewUI(db: DBClient, entryId: number) {
	const entry = await db.getEntry(entryId)
	if (!entry) {
		return /* html */ `
<html>
	${getHead()}
	<body>
		<div class="container">
			<div class="error-state">
				${createIcon('alert-circle', 'error-icon')}
				<h1>Entry not found</h1>
				${createButton('Go Back', '/', 'secondary')}
			</div>
		</div>
</html>
		`
	}
	return /* html */ `
<html>
	${getHead()}
	<body>
		<div class="container">
			<h1 class="title">${entry.title}</h1>
			<article class="entry-content">
				<div class="entry-meta">
					${createIcon('calendar', 'meta-icon')}
					<span>Created: ${new Date().toLocaleDateString()}</span>
				</div>
				<div class="content">
					${entry.content}
				</div>
			</article>
		</div>
</html>
	`
}

// UI Components
function createButton(
	text: string,
	href?: string,
	variant: 'primary' | 'secondary' = 'primary',
) {
	const baseClass = `btn btn-${variant}`
	if (href) {
		return `<a href="${href}" class="${baseClass}">${text}</a>`
	}
	return `<button class="${baseClass}">${text}</button>`
}

function createLink(href: string, text: string, iconName?: string) {
	const icon = iconName ? createIcon(iconName, 'link-icon') : ''
	return `<a href="${href}" class="link">${icon}${text}</a>`
}

function createIcon(name: string, className?: string) {
	const iconClass = className ? `icon ${className}` : 'icon'
	return `<span class="${iconClass}" data-icon="${name}">${getIconSvg(name)}</span>`
}

function createEntryCard(entry: any) {
	return /* html */ `
		<article class="entry-card">
			<div class="card-header">
				${createIcon('file-text', 'card-icon')}
				<h3 class="card-title">${entry.title}</h3>
			</div>
			<div class="card-content">
				<p>${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}</p>
			</div>
			<div class="card-actions">
				${createButton('View', `/entry/${entry.id}`, 'primary')}
			</div>
		</article>
	`
}

function getIconSvg(name: string) {
	const icons: Record<string, string> = {
		home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>',
		plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
		'file-text':
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>',
		calendar:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
		'alert-circle':
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
	}
	return icons[name] || ''
}

function getHead() {
	return /* html */ `
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Epic Me</title>
		<style>
			${getStyles()}
		</style>
	</head>
	`
}

function getStyles() {
	return /* css */ `
		/* Reset and base styles */
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			line-height: 1.6;
			color: #333;
			background-color: #f8fafc;
		}
		
		/* Layout */
		.container {
			max-width: 1200px;
			margin: 0 auto;
			padding: 2rem 1rem;
		}
		
		.title {
			font-size: 2rem;
			font-weight: 700;
			color: #1e293b;
			margin-bottom: 2rem;
			text-align: center;
		}
		
		/* Buttons */
		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0.75rem 1.5rem;
			border-radius: 0.5rem;
			font-weight: 500;
			text-decoration: none;
			border: none;
			cursor: pointer;
			transition: all 0.2s ease;
			font-size: 0.875rem;
			gap: 0.5rem;
		}
		
		.btn-primary {
			background-color: #3b82f6;
			color: white;
		}
		
		.btn-primary:hover {
			background-color: #2563eb;
			transform: translateY(-1px);
		}
		
		.btn-secondary {
			background-color: #f1f5f9;
			color: #475569;
			border: 1px solid #e2e8f0;
		}
		
		.btn-secondary:hover {
			background-color: #e2e8f0;
			border-color: #cbd5e1;
		}
		
		/* Links */
		.link {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			color: #3b82f6;
			text-decoration: none;
			font-weight: 500;
			transition: color 0.2s ease;
		}
		
		.link:hover {
			color: #2563eb;
		}
		
		/* Icons */
		.icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 1.25rem;
			height: 1.25rem;
		}
		
		.icon svg {
			width: 100%;
			height: 100%;
		}
		
		.link-icon {
			color: #64748b;
		}
		
		.meta-icon {
			color: #94a3b8;
		}
		
		.card-icon {
			color: #3b82f6;
		}
		
		.error-icon {
			color: #ef4444;
			width: 3rem;
			height: 3rem;
		}
		
		/* Entry Cards */
		.entries-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
			gap: 1.5rem;
		}
		
		.entry-card {
			background: white;
			border-radius: 0.75rem;
			padding: 1.5rem;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
			border: 1px solid #e2e8f0;
			transition: all 0.2s ease;
		}
		
		.entry-card:hover {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			transform: translateY(-2px);
		}
		
		.card-header {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			margin-bottom: 1rem;
		}
		
		.card-title {
			font-size: 1.125rem;
			font-weight: 600;
			color: #1e293b;
		}
		
		.card-content {
			margin-bottom: 1.5rem;
			color: #64748b;
		}
		
		.card-actions {
			display: flex;
			justify-content: flex-end;
		}
		
		/* Entry Content */
		.entry-content {
			background: white;
			padding: 2rem;
			border-radius: 0.75rem;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
			border: 1px solid #e2e8f0;
		}
		
		.entry-meta {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 1.5rem;
			padding-bottom: 1rem;
			border-bottom: 1px solid #e2e8f0;
			color: #64748b;
			font-size: 0.875rem;
		}
		
		.content {
			font-size: 1.125rem;
			line-height: 1.7;
			color: #334155;
		}
		
		/* Error State */
		.error-state {
			text-align: center;
			padding: 4rem 2rem;
		}
		
		.error-state h1 {
			margin: 1rem 0 2rem;
			color: #1e293b;
		}
		
		/* Responsive */
		@media (max-width: 768px) {
			.entries-grid {
				grid-template-columns: 1fr;
			}
			
			.entry-content {
				padding: 1.5rem;
			}
		}
	`
}
