import { CheckIcon, CopyIcon, PencilIcon, RefreshCcwIcon, XIcon } from 'lucide-react';
import type { Message as _Message } from '~frontend/lib/types';
import { Tooltip } from '~frontend/components/tooltip';
import { Fragment, useEffect, useState } from 'react';
import { Button } from '~frontend/components/button';
import { markedHighlight } from 'marked-highlight';
import { useLiveQuery } from 'dexie-react-hooks';
import useChatApi from '../chat-input/api';
import db from '~frontend/lib/dexie';
import * as cheerio from 'cheerio';
import { Marked } from 'marked';
import hljs from 'highlight.js';

type Props = {
	data: _Message;
};

const Message = ({ data }: Props) => {
	const [isEditing, setIsEditing] = useState(false);
	const { chatId, regenerateMessage, editMessage } = useChatApi();
	const [editedContent, setEditedContent] = useState(data.content);
	const [formattedContent, setFormattedContent] = useState<string>('');
	const activeRequests = useLiveQuery(() => db.activeRequests.toArray());

	const formatContent = async () => {
		const marked = new Marked(
			markedHighlight({
				highlight(code, lang) {
					const language = hljs.getLanguage(lang) ? lang : 'plaintext';
					return hljs.highlight(code, { language }).value;
				}
			}),
			{
				gfm: true,
				breaks: true,
				async: true
			}
		);

		// Parse Markdown to HTML
		const html = await marked.parse(data.content);

		// Load HTML into Cheerio
		const $ = cheerio.load(html);

		// Add Tailwind classes to specific elements
		$('h1').addClass('text-3xl font-bold mb-4');
		$('p').addClass('text-sm mb-4');
		$('ul').addClass('list-disc pl-5');
		$('li').addClass('mb-2');
		$('a').addClass('text-primary underline');

		$('pre').addClass('bg-card overflow-auto text-sm text-white my-2 rounded-xl p-4 break-words');

		$('pre').each((_, el) => {
			const $el = $(el);
			const codeHtml = $.html($el);
			const codeTag = $el.find('code');
			const langClass = codeTag.attr('class') || '';
			const langMatch = langClass.match(/language-(\w+)/);
			const lang = langMatch ? langMatch[1] : 'plaintext';

			const wrapper = `
			<div class="relative group my-4 overflow-hidden">
				<div class="absolute w-full h-8 px-3 bg-accent flex-between-center rounded-t-xl">
					<span class="text-xs text-muted-foreground">${lang}</span>
					
					<button class="cursor-pointer hover:text-primary" title="Copy" onclick="codeBlockCopy(this)">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
					</button>
				</div>	

				<div class="pt-4">
				${codeHtml}
				</div>
			</div>
			`;
			$el.replaceWith(wrapper);
		});

		setFormattedContent($.html());
	};

	useEffect(() => {
		formatContent();
	}, [data]);

	useEffect(() => {
		// @ts-ignore Define the copy function globally once
		window.codeBlockCopy = (btn: HTMLElement) => {
			const code = btn.parentElement?.parentElement?.querySelector('pre code');
			if (!code) return;

			const text = code.textContent || '';
			navigator.clipboard.writeText(text);
		};
	}, []);

	const handleEditSave = async () => {
		if (editedContent.trim() === data.content) {
			setIsEditing(false);
			return;
		}

		setIsEditing(false);
		await editMessage(data.id, editedContent);
	};

	const handleEditCancel = () => {
		setEditedContent(data.content);
		setIsEditing(false);
	};

	const activeRequest = activeRequests?.find((r) => r.chatId === chatId);

	return (
		<div className="w-full max-w-[755px] mx-auto space-y-2 group">
			{isEditing ? (
				<textarea className="bg-accent/50 rounded-xl py-2 px-3 w-fit resize-none outline-none" value={editedContent} onChange={(e) => setEditedContent(e.target.value)} />
			) : data.role === 'user' ? (
				<p className="bg-accent/50 rounded-xl py-2 px-3 w-fit">{data.content}</p>
			) : (
				<div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: formattedContent }} />
			)}

			{/* Attachments  */}
			{data.attachments.length !== 0 && (
				<div className="flex-start-center gap-x-2 py-1">
					{data.attachments.map((attachment, index) => {
						const isImage = attachment.mimeType.startsWith('image/');

						return (
							<div key={index} className="flex-center-center overflow-hidden">
								{isImage && (
									<img
										src={`data:${attachment.mimeType};base64,${attachment.data}`}
										className="size-11 rounded-lg object-cover border"
										title={attachment.fileName}
										alt={attachment.fileName}
									/>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Options */}
			{!activeRequest && (
				<div className="flex-start-center gap-x-1 -mx-2 opacity-0 transition-smooth group-hover:opacity-100">
					{isEditing && (
						<Fragment>
							<Tooltip content="Save">
								<Button variant="ghost" size="icon" onClick={handleEditSave}>
									<CheckIcon />
								</Button>
							</Tooltip>

							<Tooltip content="Cancel">
								<Button variant="ghost" size="icon" title="Cancel" onClick={handleEditCancel}>
									<XIcon />
								</Button>
							</Tooltip>
						</Fragment>
					)}

					{data.role === 'assistant' && (
						<Fragment>
							<Tooltip content="Regenerate">
								<Button variant="ghost" size="icon" onClick={async () => await regenerateMessage(data.id)}>
									<RefreshCcwIcon />
								</Button>
							</Tooltip>
						</Fragment>
					)}

					{data.role === 'user' && !isEditing && (
						<Fragment>
							<Tooltip content="Edit">
								<Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
									<PencilIcon />
								</Button>
							</Tooltip>
						</Fragment>
					)}

					{!isEditing && (
						<Tooltip content="Copy">
							<Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(data.content)}>
								<CopyIcon />
							</Button>
						</Tooltip>
					)}
				</div>
			)}
		</div>
	);
};

export default Message;
