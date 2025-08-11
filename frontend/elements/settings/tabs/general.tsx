import { Button } from '~frontend/components/button';
import { useApp } from '~frontend/lib/context';
import { useNavigate } from 'react-router';
import apiClient from '~frontend/lib/api';
import db from '~frontend/lib/dexie';
import { toast } from 'sonner';

const GeneralTab = () => {
	const navigate = useNavigate();
	const { session, setSession, setAbortControllers } = useApp();

	const handleLogout = async () => {
		await apiClient.auth.logout.post();
		setSession(null);

		toast.success('You have successfully logged out.');
		navigate('/login');
	};

	const handleDeleteChats = async () => {
		const yes = window.confirm('Are you sure you want to delete all your chats?');
		if (!yes) return;

		await db.chats.clear();

		const { error } = await apiClient.chats.delete();
		if (error) return toast.error(error?.value.toString());

		await db.activeRequests.clear();
		setAbortControllers([]);
		toast.success('You have successfully deleted all your chats.');
		navigate('/');
	};

	if (!session) return null;

	return (
		<div className="size-full pl-3 space-y-5 animate-in fade-in">
			{/* Account */}
			<div className="relative flex-start-center gap-x-2 border-b pb-5">
				{/* Avatar */}
				<div className="size-11 flex-center-center bg-accent rounded-full select-none">
					<span className="text-2xl text-muted-foreground">{session?.username[0]}</span>
				</div>

				{/* Info */}
				<div className="flex flex-col items-start">
					<div className="text-base">{session?.username}</div>
					<div className="text-xs text-muted-foreground">{session?.id}</div>
				</div>

				{/* Logout */}
				<Button variant="ghost" className="absolute right-0 !text-destructive hover:bg-destructive/5" onClick={handleLogout}>
					LogOut
				</Button>
			</div>

			{/* Data Control */}
			<div className="flex-between-center">
				<div>
					<div>Delete Chats History</div>
					<p className="text-xs text-muted-foreground">Delete all your chats history.</p>
				</div>
				<Button variant="outline" onClick={handleDeleteChats}>
					Delete
				</Button>
			</div>
		</div>
	);
};

export default GeneralTab;
