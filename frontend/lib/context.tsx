import type { _AbortController, Appearance, Chat, ChatInput, Model, Session } from './types';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import apiClient from './api';
import db from './dexie';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

interface ContextData {
	abortControllers: _AbortController[];
	setAbortControllers: SetState<_AbortController[]>;

	chatInput: ChatInput;
	setChatInput: SetState<ChatInput>;

	selectedModel: Model;
	changeModel: (model: Model) => void;

	session: Session;
	setSession: SetState<Session>;

	appearance: Appearance;
	setAppearance: (params: Partial<Appearance>) => void;

	showSearch: boolean;
	setShowSearch: SetState<boolean>;
}

const getSession = async () => {
	try {
		await apiClient.auth.refresh.post();
		const { data } = await apiClient.auth.me.get();
		return data as Session;
	} catch {
		return null;
	}
};

const AppContext = createContext<ContextData>({} as any);

export const useApp = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useAppContext must be used within AppContext');
	}
	return context;
};

const AppContextProvider = ({ children }: { children: ReactNode }) => {
	const [chatInput, setChatInput] = useState<ChatInput>({ text: '', attachments: [] });
	const [abortControllers, setAbortControllers] = useState<_AbortController[]>([]);
	const [selectedModel, setSelectedModel] = useState<Model>({} as any);
	const [session, setSession] = useState<Session>(undefined);
	const [appearance, _setAppearance] = useState<Appearance>({
		sidebarClosed: false,
		sidebarSide: 'left',
		theme: 'dark'
	});
	const [showSearch, setShowSearch] = useState(false);

	const setAppearance = (params: Partial<Appearance>) => {
		const newAppearance = { ...appearance, ...params };
		_setAppearance(newAppearance);
		localStorage.setItem('appearance', JSON.stringify(newAppearance));
	};

	const changeModel = (model: Model) => {
		if (!model) return;

		localStorage.setItem('selectedModel', model.id);
		setSelectedModel(model);
	};

	const onLoad = async () => {
		// Get appearance
		const appearanceParsed = JSON.parse(localStorage.getItem('appearance') ?? 'null');
		if (appearanceParsed) _setAppearance(appearanceParsed);

		// Get selected model
		const selectedModelId = localStorage.getItem('selectedModel');
		if (selectedModelId) {
			const selectedModel = await db.models.get(selectedModelId);
			changeModel(selectedModel ?? (await db.models.toArray())[0] ?? null);
		} else {
			changeModel((await db.models.toArray())[0] ?? null);
		}

		// Get session
		const session = await getSession();
		setSession(session);

		// Request sync
		await requestSync();
	};

	const requestSync = async () => {
		const { data, error } = await apiClient.sync.get();
		if (error) return;

		await Promise.all([
			db.transaction('rw', db.chats, async () => {
				await db.chats.clear();
				await db.chats.bulkAdd(data.chats as Chat[]);
			}),
			db.transaction('rw', db.models, async () => {
				await db.models.clear();
				await db.models.bulkAdd(data.models as Model[]);
			})
		]);

		changeModel(data.models[0] ?? null);
	};

	useEffect(() => {
		onLoad();
	}, []);

	useEffect(() => {
		if (appearance.theme === 'dark') {
			document.documentElement.classList.remove('neollmchat-light');
			document.documentElement.classList.add('neollmchat-dark');
			document.documentElement.style.colorScheme = 'dark';
		} else {
			document.documentElement.classList.remove('neollmchat-dark');
			document.documentElement.classList.add('neollmchat-light');
			document.documentElement.style.colorScheme = 'light';
		}
	}, [appearance.theme]);

	return (
		<AppContext.Provider
			value={{
				abortControllers,
				setAbortControllers,
				chatInput,
				setChatInput,
				selectedModel,
				changeModel,
				session,
				setSession,
				appearance,
				setAppearance,
				showSearch,
				setShowSearch
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export default AppContextProvider;
