import ChatInput from '~frontend/elements/chat-input';
import { useApp } from '~frontend/lib/context';
import Layout from '~frontend/elements/layout';
import { cn } from '~frontend/lib/utils';

const Home = () => {
	const { settings } = useApp();

	return (
		<Layout protectedRoute className="size-screen flex-col gap-y-8 flex-center-center">
			{/* Logo */}
			<div className={cn('bg-[url("/images/logo.png")] bg-center bg-contain bg-no-repeat size-14', settings.appearance.theme === 'light' && 'invert')} />

			<ChatInput />
		</Layout>
	);
};

export default Home;
