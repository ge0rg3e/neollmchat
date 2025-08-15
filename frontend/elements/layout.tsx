import { PanelLeftCloseIcon, PanelLeftOpenIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Tooltip } from '~frontend/components/tooltip';
import { Toaster } from '~frontend/components/sonner';
import { Button } from '~frontend/components/button';
import { cn, useScreen } from '~frontend/lib/utils';
import { useApp } from '~frontend/lib/context';
import Settings from './settings';
import { Fragment } from 'react';
import SideBar from './sidebar';

interface Props {
	className?: string;
	protectedRoute?: boolean;
	children: React.ReactNode;
}

const Layout = ({ className, protectedRoute = false, children }: Props) => {
	const { size } = useScreen();
	const location = useLocation();
	const navigate = useNavigate();
	const { session, settings, updateSettings, setShowSearch } = useApp();

	const isAuthPage = ['/login', '/register'].includes(location.pathname);

	if (protectedRoute === true && session === null) return <Navigate to="/login" replace />;

	return (
		<Fragment>
			<div className={cn('relative flex flex-row', settings.appearance.sidebarSide === 'left' ? 'flex-row' : 'flex-row-reverse')}>
				{!isAuthPage && settings.appearance.sidebarClosed && (
					<div
						className={cn(
							'absolute top-3 z-10 bg-accent/50 backdrop-blur-sm border rounded-lg flex flex-row gap-x-2',
							settings.appearance.sidebarSide === 'left' ? 'left-3' : 'right-3',
							size.width < 890 && '!backdrop-blur-xl'
						)}
					>
						<Tooltip content="Search" side={settings.appearance.sidebarSide === 'left' ? 'right' : 'left'}>
							<Button onClick={() => setShowSearch(true)} variant="ghost" size="icon-lg">
								<SearchIcon />
							</Button>
						</Tooltip>

						<Tooltip content="New Chat" side={settings.appearance.sidebarSide === 'left' ? 'right' : 'left'}>
							<Button onClick={() => navigate('/')} variant="ghost" size="icon-lg">
								<PlusIcon />
							</Button>
						</Tooltip>

						<Tooltip content="Open Sidebar" side={settings.appearance.sidebarSide === 'left' ? 'right' : 'left'}>
							<Button onClick={() => updateSettings('appearance.sidebarClosed', false)} variant="ghost" size="icon-lg">
								{settings.appearance.sidebarSide === 'right' ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
							</Button>
						</Tooltip>
					</div>
				)}

				{!isAuthPage && <SideBar />}
				<main
					className={cn(
						'bg-card bg-noise',
						className,
						!isAuthPage && size.width > 1100 && !settings.appearance.sidebarClosed && 'mt-3.5',
						!settings.appearance.sidebarClosed && settings.appearance.sidebarSide === 'left' ? 'rounded-tl-xl' : 'rounded-tr-xl'
					)}
				>
					{children}
				</main>
			</div>

			<Settings />
			<Toaster />
		</Fragment>
	);
};

export default Layout;
