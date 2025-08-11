export type Appearance = {
	theme: 'dark' | 'light';
	sidebarSide: 'left' | 'right';
	sidebarClosed: boolean;
};

export type ActiveRequest = {
	requestId: string;
	chatId: string;
};

export type Model = {
	id: string;
	model: string;
	provider: string;
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

export type Session =
	| {
			id: string;
			username: string;
			role: 'admin' | 'user';
	  }
	| null
	| undefined;

export type ChatInput = {
	text: string;
	attachments: Array<Attachment>;
};

export type _AbortController = {
	requestId: string;
	controller: AbortController;
};
