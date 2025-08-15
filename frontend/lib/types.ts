type NullOrUndefined<T> = T | null | undefined;

export type Model = {
	id: string;
	model: string;
	provider: string;
	attributes: {
		imageUpload: boolean;
		imageGeneration: boolean;
		thinkingMode: boolean;
	};
};

export type Settings = {
	appearance: {
		theme: 'dark' | 'light';
		sidebarSide: 'left' | 'right';
		sidebarClosed: boolean;
	};
	transcribe: {
		language: string;
		autoSend: boolean;
	};
	selectedModel: Model;
};

export type ActiveRequest = {
	requestId: string;
	chatId: string;
};

export type Attachment = {
	fileName: string;
	mimeType: string;
	data: string;
};

export type Message = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	attachments: Array<Attachment>;
	modelId?: string;
};

export type Chat = {
	id: string;
	title: string;
	messages: Array<Message>;
	createdBy: string;
	createdAt: Date;
};

export type Session = NullOrUndefined<{
	id: string;
	username: string;
	role: 'admin' | 'user';
}>;

export type ChatInput = {
	text: string;
	attachments: Array<Attachment>;
};

export type _AbortController = {
	requestId: string;
	controller: AbortController;
};
