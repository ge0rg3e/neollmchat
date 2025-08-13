import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '~frontend/components/dropdown-menu';
import type { Message, Attachment } from '~frontend/lib/types';
import { Button } from '~frontend/components/button';
import { twMerge, useScreen } from '~frontend/lib/utils';
import { DownloadIcon } from 'lucide-react';
import db from '~frontend/lib/dexie';
import { useApp } from '~frontend/lib/context';

const downloadFile = (filename: string, content: string | Blob) => {
	const blob = typeof content === 'string' ? new Blob([content], { type: 'text/plain' }) : content;
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

const formatMessagesAsMarkdown = (messages: Message[]): string => {
	return messages
		.map((msg: Message) => {
			let content = `**${msg.role === 'user' ? 'User' : 'Assistant'}:**\n`;
			content += msg.content + '\n';
			if (msg.attachments && msg.attachments.length > 0) {
				content +=
					msg.attachments
						.map((att: Attachment) => {
							if (att.mimeType.startsWith('image/')) {
								return `![${att.fileName}](data:${att.mimeType};base64,${att.data})`;
							} else {
								return `[${att.fileName} - ${att.mimeType}]`;
							}
						})
						.join('\n') + '\n';
			}
			return content;
		})
		.join('\n---\n');
};

const formatMessagesAsPlainText = (messages: Message[]): string => {
	return messages
		.map((msg: Message) => {
			let content = `${msg.role === 'user' ? 'User' : 'Assistant'}:\n`;
			content += msg.content + '\n';
			if (msg.attachments && msg.attachments.length > 0) {
				content += msg.attachments.map((att: Attachment) => `${att.fileName} (${att.mimeType})`).join(', ') + '\n';
			}
			return content;
		})
		.join('\n----------------\n');
};

const formatMessagesAsPDF = async (messages: Message[], chatTitle: string) => {
	try {
		const jsPDF = (await import('jspdf')).default;
		const doc = new jsPDF();
		let y = 10;
		doc.setFontSize(16);
		doc.text(chatTitle, 10, y);
		y += 10;
		doc.setFontSize(12);
		messages.forEach((msg: Message) => {
			if (y > 270) {
				doc.addPage();
				y = 10;
			}
			doc.text(`${msg.role === 'user' ? 'User' : 'Assistant'}:`, 10, y);
			y += 7;
			const lines = doc.splitTextToSize(msg.content, 180);
			doc.text(lines, 10, y);
			y += lines.length * 7;
			if (msg.attachments && msg.attachments.length > 0) {
				msg.attachments.forEach((att: Attachment) => {
					if (att.mimeType.startsWith('image/')) {
						try {
							doc.addImage(`data:${att.mimeType};base64,${att.data}`, att.mimeType.split('/')[1], 10, y, 40, 30);
							y += 32;
						} catch (e) {
							doc.text(`[Image: ${att.fileName}]`, 10, y);
							y += 7;
						}
					} else {
						doc.text(`[Attachment: ${att.fileName}]`, 10, y);
						y += 7;
					}
				});
			}
			y += 5;
		});
		return doc;
	} catch (e) {
		return null;
	}
};

export const ExportChat = ({ chatId }: { chatId: string }) => {
	const { size } = useScreen();
	const { settings } = useApp();

	const handleExport = async (format: 'pdf' | 'md' | 'txt') => {
		const chats = await db.chats.toArray();
		const chat = chats.find((c) => c.id === chatId);
		if (!chat) return;

		const messages: Message[] = chat.messages;
		const baseName = `${chat.title || 'Chat'} - NeoLLMChat`;
		if (format === 'md') {
			const md = formatMessagesAsMarkdown(messages);
			downloadFile(`${baseName}.md`, md);
		} else if (format === 'txt') {
			const txt = formatMessagesAsPlainText(messages);
			downloadFile(`${baseName}.txt`, txt);
		} else if (format === 'pdf') {
			const doc = await formatMessagesAsPDF(messages, chat.title || 'Chat');
			if (!doc) {
				alert('jsPDF is not installed. Please run: bun add jspdf');
			} else {
				doc.save(`${baseName}.pdf`);
			}
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className={twMerge('absolute top-3', size.width < 890 && '!backdrop-blur-xl', settings.appearance.sidebarSide === 'left' ? 'right-3' : 'left-3')} variant="outline" size="icon">
					<DownloadIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleExport('md')}>Markdown</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleExport('txt')}>Plain Text</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ExportChat;
