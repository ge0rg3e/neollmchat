import type { Settings, Chat, ChatInput, Model, Session, _AbortController } from './types';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import apiClient from './api';
import db from './dexie';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

interface ContextData {
	settings: Settings;
	updateSettings: (path: string, value: any) => void;

	abortControllers: _AbortController[];
	setAbortControllers: SetState<_AbortController[]>;

	chatInput: ChatInput;
	setChatInput: SetState<ChatInput>;

	session: Session;
	setSession: SetState<Session>;

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
	const [session, setSession] = useState<Session>(undefined);
	const [showSearch, setShowSearch] = useState(false);
	const [settings, setSettings] = useState<Settings>({
		appearance: {
			theme: 'dark',
			sidebarSide: 'left',
			sidebarClosed: false
		},
		transcribe: {
			language: 'auto',
			autoSend: false
		},
		selectedModel: {} as any
	});

	const updateSettings = (path: string, value: any) => {
		setSettings((prev) => {
			const keys = path.split('.');
			const newState = { ...prev } as any;
			let curr = newState;

			for (let i = 0; i < keys.length - 1; i++) {
				curr[keys[i]] = { ...curr[keys[i]] };
				curr = curr[keys[i]];
			}

			curr[keys[keys.length - 1]] = value;

			localStorage.setItem('@settings', JSON.stringify(newState));

			return newState;
		});
	};

	const onLoad = async () => {
		// Get settings
		const settingsParsed = JSON.parse(localStorage.getItem('@settings') ?? 'null');
		if (settingsParsed) setSettings(settingsParsed);

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

		updateSettings('selectedModel', data.models[0] ?? null);
	};

	useEffect(() => {
		onLoad();
	}, []);

	useEffect(() => {
		if (settings.appearance.theme === 'dark') {
			document.documentElement.classList.add('dark');
			document.documentElement.style.colorScheme = 'dark';
		} else {
			document.documentElement.classList.remove('dark');
			document.documentElement.style.colorScheme = 'light';
		}
	}, [settings.appearance.theme]);

	return (
		<AppContext.Provider value={{ settings, updateSettings, abortControllers, setAbortControllers, chatInput, setChatInput, session, setSession, showSearch, setShowSearch }}>
			{children}
		</AppContext.Provider>
	);
};

export default AppContextProvider;
