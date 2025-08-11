import type { ActiveRequest, Chat, Model } from './types';
import Dexie, { type Table } from 'dexie';

interface ChatDexie extends Dexie {
	chats: Table<Chat>;
	models: Table<Model>;
	activeRequests: Table<ActiveRequest>;
}

const db = new Dexie('neollmchat') as ChatDexie;

db.version(1).stores({
	chats: 'id, title, createdBy, createdAt',
	activeRequests: 'requestId, chatId',
	models: 'id'
});

export default db;
