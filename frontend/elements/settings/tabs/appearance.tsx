import { MoonIcon, PanelLeft, PanelRight, SunIcon } from 'lucide-react';
import { Tooltip } from '~frontend/components/tooltip';
import { Button } from '~frontend/components/button';
import { useApp } from '~frontend/lib/context';
import { cn } from '~frontend/lib/utils';

const AppearanceTab = () => {
	const { settings, updateSettings } = useApp();

	return (
		<div className="size-full pl-3 space-y-5 animate-in fade-in">
			{/* Theme Selector */}
			<div className="flex-between-center">
				<div>
					<div>Theme</div>
					<p className="text-xs text-muted-foreground">Select the preferred theme.</p>
				</div>

				<div className="flex-end-center gap-x-1">
					<Tooltip content="Dark Theme">
						<Button className={cn(settings.appearance.theme === 'dark' && 'bg-accent')} variant="ghost" size="icon" onClick={() => updateSettings('appearance.theme', 'dark')}>
							<MoonIcon />
						</Button>
					</Tooltip>

					<Tooltip content="Light Theme">
						<Button className={cn(settings.appearance.theme === 'light' && 'bg-accent')} variant="ghost" size="icon" onClick={() => updateSettings('appearance.theme', 'light')}>
							<SunIcon />
						</Button>
					</Tooltip>
				</div>
			</div>

			{/* SideBar Side Selector */}
			<div className="flex-between-center">
				<div>
					<div>SideBar Side</div>
					<p className="text-xs text-muted-foreground">Select the side where the sidebar should appear.</p>
				</div>

				<div className="flex-end-center gap-x-1">
					<Tooltip content="Left">
						<Button className={cn(settings.appearance.sidebarSide === 'left' && 'bg-accent')} variant="ghost" size="icon" onClick={() => updateSettings('appearance.sidebarSide', 'left')}>
							<PanelLeft />
						</Button>
					</Tooltip>

					<Tooltip content="Right">
						<Button
							className={cn(settings.appearance.sidebarSide === 'right' && 'bg-accent')}
							onClick={() => updateSettings('appearance.sidebarSide', 'right')}
							variant="ghost"
							size="icon"
						>
							<PanelRight />
						</Button>
					</Tooltip>
				</div>
			</div>
		</div>
	);
};

export default AppearanceTab;
