import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~frontend/components/dialog';
import { InfoIcon, PackageIcon, PaintBucketIcon, Settings2Icon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { cn } from '~frontend/lib/utils';
import { useEffect } from 'react';

// Tabs
import AppearanceTab from './tabs/appearance';
import GeneralTab from './tabs/general';
import ModelsTab from './tabs/models';
import AboutTab from './tabs/about';

const tabs = [
	{
		id: 'general',
		label: 'General',
		icon: Settings2Icon,
		Content: GeneralTab
	},
	{
		id: 'appearance',
		label: 'Appearance',
		icon: PaintBucketIcon,
		Content: AppearanceTab
	},
	{
		id: 'models',
		label: 'Models',
		icon: PackageIcon,
		Content: ModelsTab
	},
	{
		id: 'about',
		label: 'About',
		icon: InfoIcon,
		Content: AboutTab
	}
];

const Settings = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const settingsTab = searchParams.get('settings');

	const handleClose = () => {
		searchParams.delete('settings');
		navigate({ search: searchParams.toString() });
	};

	const handleChangeTab = (tab: string) => {
		searchParams.set('settings', tab);
		navigate({ search: searchParams.toString() });
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			handleClose();
		}
	};

	useEffect(() => {
		document.addEventListener('keydown', handleKeydown);
	}, []);

	const tab = tabs.find((tab) => tab.id === settingsTab);

	return (
		<Dialog open={Boolean(tab)} onOpenChange={(state) => state === false && handleClose()}>
			<DialogContent className="size-full !max-w-[760px] !max-h-[500px]">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>

				<div className="h-[400px] flex flex-row gap-x-3">
					{/* Tabs */}
					<div className="size-full max-w-[180px] space-y-1.5">
						{tabs.map((tab, index) => {
							return (
								<button
									className={cn(
										'w-full h-9 text-sm rounded-lg px-3 flex-start-center gap-x-2 cursor-pointer transition-smooth hover:bg-accent',
										settingsTab === tab.id && 'bg-accent'
									)}
									onClick={() => handleChangeTab(tab.id)}
									key={index}
								>
									{tab.icon && <tab.icon className="size-4.5" />}
									{tab.label}
								</button>
							);
						})}
					</div>

					{tab && <tab.Content />}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Settings;
