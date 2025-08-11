import { ArrowDownIcon, SendHorizontalIcon, SquareIcon } from 'lucide-react';
import { AttachmentsPreview, AttachmentsTrigger } from './attachments';
import { twMerge, useScreen } from '~frontend/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '~frontend/components/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '~frontend/lib/context';
import ModelSelector from './model-selector';
import { useLocation } from 'react-router';
import db from '~frontend/lib/dexie';
import useChatApi from './api';

const ChatInput = () => {
	const { size } = useScreen();
	const { pathname } = useLocation();
	const { chatInput, setChatInput } = useApp();
	const { chatId, sendMessage, stopRequest } = useChatApi();
	const [showScrollToBottom, setShowScrollToBottom] = useState(false);
	const activeRequests = useLiveQuery(() => db.activeRequests.toArray());

	const handleSend = () => (activeRequests?.find((r) => r.chatId === chatId) ? stopRequest() : sendMessage());

	const buttonState = useMemo(() => {
		const activeRequest = activeRequests?.find((r) => r.chatId === chatId);
		if (activeRequest) return { disabled: false, icon: SquareIcon, label: 'Stop' };
		if (!chatInput.text.trim()) return { disabled: true, icon: SendHorizontalIcon, label: 'Send' };
		return { disabled: false, icon: SendHorizontalIcon, label: 'Send' };
	}, [chatId, chatInput, activeRequests]);

	useEffect(() => {
		const chatMessages = document.getElementById('chat-messages');
		if (!chatMessages) return;

		chatMessages.addEventListener('scroll', () => {
			const state = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight;
			setShowScrollToBottom(!state);
		});
	}, []);

	return (
		<div className={twMerge('w-full flex items-center justify-center', pathname.includes('/c') && 'fixed bottom-5 max-w-[calc(100vw-270px)]', size.width < 1100 && 'max-w-full px-5')}>
			<div className="w-full max-w-[765px] max-h-[200px] p-2 rounded-3xl bg-accent/50 backdrop-blur-xl">
				{showScrollToBottom && (
					<Button
						onClick={() => {
							const chatMessages = document.getElementById('chat-messages');
							if (!chatMessages) return;
							chatMessages.scroll({ top: chatMessages.scrollHeight, behavior: 'smooth' });
						}}
						className=" absolute bottom-40 right-0"
						variant="outline"
						size="icon"
					>
						<ArrowDownIcon />
					</Button>
				)}

				<div className="flex flex-col w-full h-full rounded-2xl bg-accent/70">
					<AttachmentsPreview />
					<textarea
						className="w-full h-full p-3 pb-0 bg-transparent border-none outline-none resize-none rounded-xl text-foreground placeholder:text-muted-foreground"
						onChange={(e) => setChatInput((prev) => ({ ...prev, text: e.target.value }))}
						placeholder="Type your prompt here..."
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								handleSend();
							}
						}}
						value={chatInput.text}
					/>
					<div className="flex items-center justify-between w-full p-2.5 py-2">
						<div className="flex-start-center gap-x-2">
							<AttachmentsTrigger />
							<ModelSelector />
						</div>

						<Button size="icon" disabled={buttonState.disabled} title={buttonState.label} onClick={handleSend}>
							<buttonState.icon className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ChatInput;
