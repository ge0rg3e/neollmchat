import { PanelLeftCloseIcon, PanelLeftOpenIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { twMerge, useScreen, formatDateGroup, truncateString } from '~frontend/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router';
import { Tooltip } from '~frontend/components/tooltip';
import { Button } from '~frontend/components/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '~frontend/lib/context';
import apiClient from '~frontend/lib/api';
import db from '~frontend/lib/dexie';
import { Fragment } from 'react';
import { toast } from 'sonner';
import Search from './search';

const SideBar = () => {
	const { size } = useScreen();
	const navigate = useNavigate();
	const location = useLocation();
	const chats = useLiveQuery(() => db.chats.toArray());
	const { session, appearance, setAppearance, setAbortControllers, setShowSearch } = useApp();

	const handleDeleteChat = async (chatId: string) => {
		await db.chats.delete(chatId);
		await db.activeRequests.delete(chatId);
		setAbortControllers((prev) => prev.filter((ac) => ac.requestId !== chatId));

		const { error } = await apiClient.chat.delete({ id: chatId });
		if (error) return toast.error(error?.value.toString());

		toast.success('You have successfully deleted this chat.');
		navigate('/');
	};

	const groupedChats = chats?.reduce((acc, chat) => {
		const dateGroup = formatDateGroup(new Date(chat.createdAt));
		if (!acc[dateGroup]) {
			acc[dateGroup] = [];
		}
		acc[dateGroup].push(chat);
		return acc;
	}, {} as Record<string, typeof chats>);

	return (
		<Fragment>
			<aside
				className={twMerge(
					'w-full max-w-[270px] h-screen p-3 bg-background flex-col flex-between-center z-30 transition-smooth',
					appearance.sidebarClosed && `fixed top-0 ${appearance.sidebarSide === 'left' ? '!-left-full' : '!-right-full'}`,
					size.width < 1100 && 'fixed top-0 left-0'
				)}
			>
				{/* Top */}
				<div className="w-full space-y-5">
					{/* Header */}
					<div className="flex-between-center">
						<div className='bg-[url("/images/logo.png")] bg-center bg-contain bg-no-repeat size-8' />

						<div className="flex-end-center gap-x-0.5">
							<Tooltip content="Search" side={appearance.sidebarSide === 'left' ? 'right' : 'left'}>
								<Button variant="ghost" size="sm" onClick={() => setShowSearch(true)}>
									<SearchIcon />
								</Button>
							</Tooltip>

							<Tooltip content="New Chat" side={appearance.sidebarSide === 'left' ? 'right' : 'left'}>
								<Button variant="ghost" size="sm" onClick={() => navigate('/')}>
									<PlusIcon />
								</Button>
							</Tooltip>
						</div>
					</div>

					{/* Chats */}
					<div className="space-y-2">
						{Object.entries(groupedChats || {}).map(([dateGroup, chatsInGroup]) => (
							<div key={dateGroup} className="space-y-1.5">
								<div className="text-xs text-primary px-1.5 py-2">{dateGroup}</div>
								{chatsInGroup?.map((chat, index) => (
									<Link
										className={twMerge(
											'relative group w-full h-9 px-3.5 flex-start-center rounded-lg transition-smooth hover:bg-accent',
											location.pathname === `/c/${chat.id}` && 'bg-accent'
										)}
										to={`/c/${chat.id}`}
										key={index}
									>
										{/* Title */}
										<span className="text-sm text-foreground" title={chat.title}>
											{truncateString(chat.title, 28)}
										</span>

										{/* Actions */}
										<div className="absolute flex-center-center right-3.5 transition-smooth opacity-0 group-hover:opacity-100">
											<button
												className="flex-center-center cursor-pointer transition-smooth hover:text-destructive"
												title="Delete Chat"
												onClick={() => handleDeleteChat(chat.id)}
											>
												<Trash2Icon className="size-4" />
											</button>
										</div>
									</Link>
								))}
							</div>
						))}
					</div>
				</div>

				{/* Bottom */}
				<div className="w-full">
					<div className="flex-between-center">
						{/* Account */}
						{session && (
							<Link className="w-full h-9 px-3.5 flex-start-center gap-x-2 rounded-lg transition-smooth hover:bg-accent" to="?settings=general">
								{/* Avatar */}
								<div className="size-7 flex-center-center bg-accent rounded-full select-none">
									<span className="text-muted-foreground">{session?.username[0]}</span>
								</div>

								{/* Info */}
								<div className="text-sm">{session?.username}</div>
							</Link>
						)}

						{/* Close Sidebar */}
						<Tooltip content="Close" side={appearance.sidebarSide === 'left' ? 'right' : 'left'}>
							<Button variant="ghost" size="sm" onClick={() => setAppearance({ sidebarClosed: true })}>
								{appearance.sidebarSide === 'left' ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
							</Button>
						</Tooltip>
					</div>
				</div>
			</aside>

			<Search />
		</Fragment>
	);
};

export default SideBar;
