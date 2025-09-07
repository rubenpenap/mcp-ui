import { type DBClient } from '@epic-web/epicme-db-client'

export async function getTagRemoteDomUIScript(db: DBClient, tagId: number) {
	const tag = await db.getTag(tagId)
	if (tag) {
		return /* js */ `
const stack = document.createElement('ui-stack');
stack.setAttribute('direction', 'vertical');
stack.setAttribute('spacing', '20');
stack.setAttribute('align', 'center');

const title = document.createElement('ui-text');
title.setAttribute('content', ${JSON.stringify(tag.name)});
stack.appendChild(title);

const description = document.createElement('ui-text');
description.setAttribute('content', ${JSON.stringify(tag.description)});
stack.appendChild(description);

const deleteButton = document.createElement('ui-button');
deleteButton.setAttribute('content', 'Delete Tag');
deleteButton.addEventListener('press', () => {
	window.parent.postMessage(
		{
			type: 'tool',
			payload: {
				toolName: 'deleteTag',
				params: { tagId: tag.id.toString() },
			},
		},
		'*',
	)
});
stack.appendChild(deleteButton);

root.appendChild(stack);
		`.trim()
	} else {
		return /* js */ `
console.error('Tag not found');
const stack = document.createElement('ui-stack');
stack.setAttribute('direction', 'vertical');
stack.setAttribute('spacing', '20');
stack.setAttribute('align', 'center');
const title = document.createElement('ui-text');
title.setAttribute('content', 'Tag not found');
stack.appendChild(title);
root.appendChild(stack);
		`
	}
}
